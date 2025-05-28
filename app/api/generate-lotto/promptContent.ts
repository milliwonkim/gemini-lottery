export const getLottoPrompt = (
  lottoTypeDescription: string,
  quantity: number,
  safeConditionDescription: string,
  conditionStipulation: string
): string => {
  return `당신은 한국 로또 번호 생성 전문가입니다. 다음 요청에 따라 로또 번호를 생성해주세요.
결과는 반드시 JSON 형식의 배열이어야 하며, 각 배열 요소는 생성된 번호들의 배열(숫자 또는 문자열 형태 가능)이어야 합니다.
예시: [[1,2,3,4,5,6], ["1","1","2","3","4","5","6"]]

1. 로또 종류: ${lottoTypeDescription}
2. 생성 수량: ${quantity}개
3. 적용 조건: ${safeConditionDescription}
4. 생성 규칙:
    - 로또 6/45: 1부터 45 사이의 중복되지 않는 숫자 6개를 오름차순으로 정렬하여 생성합니다.
    - 연금복권: 첫 번째 항목은 1부터 5 사이의 조 번호(문자열 또는 숫자), 나머지 6개 항목은 각각 0부터 9 사이의 숫자(문자열 또는 숫자)로 생성합니다. 총 7개 항목을 생성합니다. (예: ["1", "1", "2", "3", "4", "5", "6"] 또는 [1, 1, 2, 3, 4, 5, 6])
    ${conditionStipulation}
    - 과거 당첨 번호 데이터는 현재 제공되지 않으므로, 일반적인 통계적 확률 및 주어진 조건에만 기반하여 생성해주세요.

생성된 번호만 JSON 배열 형태로 응답해주세요. 다른 설명이나 부가 정보는 포함하지 마세요.
JSON 응답은 반드시 RFC 8259 표준을 따라야 합니다. 문자열은 큰따옴표로 묶여야 합니다.`;
};
