type GenerationCondition = "none" | "noConsecutive4";

interface LottoDrawResponse {
  returnValue: "success" | "fail";
  drwtNo1?: number;
  drwtNo2?: number;
  drwtNo3?: number;
  drwtNo4?: number;
  drwtNo5?: number;
  drwtNo6?: number;
}

interface CombinationMeta {
  numbers: number[];
  oddCount: number;
  evenCount: number;
  sum: number;
  hasConsecutive4: boolean;
  isPreviousWinner: boolean;
}

const FIRST_DRAW_DATE = new Date("2002-12-07T00:00:00+09:00").getTime();
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
let previousWinningKeysPromise: Promise<Set<string>> | null = null;

function getCombinationKey(numbers: number[]): string {
  return [...numbers].sort((a, b) => a - b).join("-");
}

function getEstimatedLatestDrawNo(): number {
  return Math.floor((Date.now() - FIRST_DRAW_DATE) / ONE_WEEK_MS) + 1;
}

async function fetchWinningKey(drawNo: number): Promise<string | null> {
  try {
    const response = await fetch(
      `https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${drawNo}`,
      { cache: "force-cache" }
    );

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as LottoDrawResponse;
    if (data.returnValue !== "success") {
      return null;
    }

    const numbers = [
      data.drwtNo1,
      data.drwtNo2,
      data.drwtNo3,
      data.drwtNo4,
      data.drwtNo5,
      data.drwtNo6,
    ];

    if (numbers.some((num) => typeof num !== "number")) {
      return null;
    }

    return getCombinationKey(numbers as number[]);
  } catch {
    return null;
  }
}

async function fetchPreviousWinningKeys(): Promise<Set<string>> {
  if (!previousWinningKeysPromise) {
    previousWinningKeysPromise = (async () => {
      const latestDrawNo = getEstimatedLatestDrawNo();
      const keys = new Set<string>();
      const batchSize = 30;

      for (let start = 1; start <= latestDrawNo; start += batchSize) {
        const drawNumbers = Array.from(
          { length: Math.min(batchSize, latestDrawNo - start + 1) },
          (_, index) => start + index
        );
        const batchKeys = await Promise.all(drawNumbers.map(fetchWinningKey));

        batchKeys.forEach((key) => {
          if (key) {
            keys.add(key);
          }
        });
      }

      return keys;
    })();
  }

  return previousWinningKeysPromise;
}

function drawUniformNumbers(): number[] {
  const pool = Array.from({ length: 45 }, (_, index) => index + 1);

  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return pool.slice(0, 6).sort((a, b) => a - b);
}

function hasLongConsecutiveRun(numbers: number[], runLength: number): boolean {
  let currentRun = 1;

  for (let i = 1; i < numbers.length; i++) {
    if (numbers[i] === numbers[i - 1] + 1) {
      currentRun += 1;
      if (currentRun >= runLength) {
        return true;
      }
    } else {
      currentRun = 1;
    }
  }

  return false;
}

function createMeta(
  numbers: number[],
  previousWinningKeys: Set<string>
): CombinationMeta {
  const oddCount = numbers.filter((num) => num % 2 === 1).length;

  return {
    numbers,
    oddCount,
    evenCount: numbers.length - oddCount,
    sum: numbers.reduce((acc, value) => acc + value, 0),
    hasConsecutive4: hasLongConsecutiveRun(numbers, 4),
    isPreviousWinner: previousWinningKeys.has(getCombinationKey(numbers)),
  };
}

function generateSingleCombination(
  condition: GenerationCondition,
  previousWinningKeys: Set<string>
): CombinationMeta | null {
  for (let attempt = 0; attempt < 200; attempt++) {
    const numbers = drawUniformNumbers();
    const key = getCombinationKey(numbers);
    const hasConsecutive4 = hasLongConsecutiveRun(numbers, 4);

    if (previousWinningKeys.has(key)) {
      continue;
    }

    if (condition === "noConsecutive4" && hasConsecutive4) {
      continue;
    }

    return createMeta(numbers, previousWinningKeys);
  }

  return null;
}

export async function generateLotto645(
  quantity: number,
  condition: GenerationCondition
) {
  const previousWinningKeys = await fetchPreviousWinningKeys();
  const combinations: number[][] = [];
  const metas: CombinationMeta[] = [];
  const duplicates = new Set<string>();

  for (let attempt = 0; combinations.length < quantity && attempt < quantity * 200; attempt++) {
    const result = generateSingleCombination(condition, previousWinningKeys);
    if (!result) {
      continue;
    }

    const key = result.numbers.join("-");
    if (duplicates.has(key)) {
      continue;
    }

    combinations.push(result.numbers);
    metas.push(result);
    duplicates.add(key);
  }

  if (combinations.length === 0) {
    throw new Error("번호 생성에 실패했습니다. 다시 시도해주세요.");
  }

  const conditionMessage =
    condition === "noConsecutive4"
      ? "4개 이상 연속번호 제외 조건만 적용했습니다."
      : "추가 조건 없이 생성했습니다.";

  const analysisMessage = metas
    .map((meta, index) => {
      const consecutiveText = meta.hasConsecutive4
        ? "4개 이상 연속번호 있음"
        : "4개 이상 연속번호 없음";
      const previousWinnerText = meta.isPreviousWinner
        ? "역대 1등 조합과 일치"
        : "역대 1등 조합과 불일치";

      return `#${index + 1} 조합 (${meta.numbers.join(", ")}): 홀짝 ${meta.oddCount}:${meta.evenCount}, 합계 ${meta.sum}, ${consecutiveText}, ${previousWinnerText}`;
    })
    .join("\n");

  return {
    generatedNumbers: combinations,
    analysis: `1부터 45까지 각 번호를 같은 확률로 두고, 과거 출현 통계나 미출현 기간은 가중치로 사용하지 않았습니다. 이전 1등 당첨 조합은 제외했습니다. ${conditionMessage}\n${analysisMessage}`,
  };
}
