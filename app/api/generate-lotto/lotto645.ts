const HOT_NUMBERS = new Set([
  2, 3, 5, 7, 8, 10, 12, 15, 18, 20, 21, 23, 27, 32, 34, 37, 39, 40, 43, 45,
]);

const COLD_NUMBERS = new Set([
  1, 4, 6, 9, 11, 13, 14, 16, 17, 19, 22, 24, 25, 26, 28, 29,
]);

const OVERDUE_NUMBERS = new Set([30, 31, 33, 35, 36, 38, 41, 42, 44]);

const ZONES = [
  { label: "1-10", start: 1, end: 10 },
  { label: "11-20", start: 11, end: 20 },
  { label: "21-30", start: 21, end: 30 },
  { label: "31-40", start: 31, end: 40 },
  { label: "41-45", start: 41, end: 45 },
] as const;

type ZonePattern = {
  distribution: [number, number, number, number, number];
  description: string;
};

const ZONE_PATTERNS: ZonePattern[] = [
  {
    distribution: [2, 1, 2, 1, 0],
    description: "초반 구간 2개, 중후반 균형 분포",
  },
  {
    distribution: [1, 1, 2, 1, 1],
    description: "중반에 무게를 둔 전형적인 당첨 패턴",
  },
  {
    distribution: [1, 2, 1, 1, 1],
    description: "11-20 구간 강화 패턴",
  },
  {
    distribution: [2, 1, 1, 1, 1],
    description: "초반과 후반을 동시에 가져가는 분포",
  },
];

interface CombinationMeta {
  numbers: number[];
  pattern: string;
  oddCount: number;
  evenCount: number;
  rangeBreakdown: string;
  sum: number;
  hotCount: number;
  coldCount: number;
  overdueCount: number;
}

function getWeight(num: number): number {
  if (HOT_NUMBERS.has(num)) {
    return 6;
  }
  if (OVERDUE_NUMBERS.has(num)) {
    return 4;
  }
  if (COLD_NUMBERS.has(num)) {
    return 2;
  }
  return 3;
}

function pickWeightedNumbers(
  start: number,
  end: number,
  count: number,
  used: Set<number>
): number[] {
  const candidates: { value: number; weight: number }[] = [];

  for (let value = start; value <= end; value++) {
    if (!used.has(value)) {
      candidates.push({ value, weight: getWeight(value) });
    }
  }

  const picked: number[] = [];
  const pool = [...candidates];

  while (picked.length < count && pool.length > 0) {
    const totalWeight = pool.reduce((acc, item) => acc + item.weight, 0);
    if (totalWeight === 0) {
      break;
    }
    const target = Math.random() * totalWeight;
    let cumulative = 0;
    let chosenIndex = -1;

    for (let i = 0; i < pool.length; i++) {
      cumulative += pool[i].weight;
      if (cumulative >= target) {
        chosenIndex = i;
        break;
      }
    }

    if (chosenIndex === -1) {
      break;
    }

    const [chosen] = pool.splice(chosenIndex, 1);
    picked.push(chosen.value);
    used.add(chosen.value);
  }

  return picked;
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

function countSetMatches(numbers: number[], targetSet: Set<number>): number {
  return numbers.reduce((acc, value) => (targetSet.has(value) ? acc + 1 : acc), 0);
}

function generateSingleCombination(
  condition: "none" | "noConsecutive4"
): CombinationMeta | null {
  for (let attempt = 0; attempt < 40; attempt++) {
    const pattern = ZONE_PATTERNS[Math.floor(Math.random() * ZONE_PATTERNS.length)];
    const used = new Set<number>();

    ZONES.forEach((zone, index) => {
      const quota = pattern.distribution[index];
      if (quota > 0) {
        const selected = pickWeightedNumbers(zone.start, zone.end, quota, used);
        selected.forEach((num) => used.add(num));
      }
    });

    if (used.size !== 6) {
      continue;
    }

    const numbers = Array.from(used).sort((a, b) => a - b);

    if (condition === "noConsecutive4" && hasLongConsecutiveRun(numbers, 4)) {
      continue;
    }

    const oddCount = numbers.filter((num) => num % 2 === 1).length;
    const evenCount = numbers.length - oddCount;
    if (oddCount < 2 || oddCount > 4) {
      continue;
    }

    const sum = numbers.reduce((acc, value) => acc + value, 0);
    if (sum < 90 || sum > 200) {
      continue;
    }

    const hotCount = countSetMatches(numbers, HOT_NUMBERS);
    const coldCount = countSetMatches(numbers, COLD_NUMBERS);
    const overdueCount = countSetMatches(numbers, OVERDUE_NUMBERS);

    if (hotCount < 2 || overdueCount < 1) {
      continue;
    }

    const zoneCounts = numbers.reduce<Record<string, number>>((acc, value) => {
      const zone = ZONES.find((r) => value >= r.start && value <= r.end);
      if (!zone) {
        return acc;
      }
      acc[zone.label] = (acc[zone.label] || 0) + 1;
      return acc;
    }, {});

    const rangeBreakdown = ZONES
      .map((zone) => `${zone.label} ${zoneCounts[zone.label] ?? 0}개`)
      .join(", ");

    return {
      numbers,
      pattern: pattern.description,
      oddCount,
      evenCount,
      rangeBreakdown,
      sum,
      hotCount,
      coldCount,
      overdueCount,
    };
  }

  return null;
}

export function generateLotto645(
  quantity: number,
  condition: "none" | "noConsecutive4"
) {
  const combinations: number[][] = [];
  const metas: CombinationMeta[] = [];
  const duplicates = new Set<string>();

  for (let attempt = 0; combinations.length < quantity && attempt < quantity * 30; attempt++) {
    const result = generateSingleCombination(condition);
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

  const analysisMessage = metas
    .map((meta, index) => {
      const hotColdSummary = `핫 ${meta.hotCount}개, 콜드 ${meta.coldCount}개, 미출현 ${meta.overdueCount}개`;
      return `#${index + 1} 조합 (${meta.numbers.join(", ")}): ${meta.pattern}. ${meta.rangeBreakdown}. 홀짝 ${meta.oddCount}:${meta.evenCount}, 합계 ${meta.sum}. ${hotColdSummary}`;
    })
    .join("\n");

  return {
    generatedNumbers: combinations,
    analysis: `핫/콜드/미출현 기반 통계와 구간 분포, 홀짝 균형을 적용한 한국 로또 6/45 대표 예측 방식으로 번호를 구성했습니다.\n${analysisMessage}`,
  };
}
