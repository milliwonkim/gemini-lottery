"use client";

import { useState, useMemo } from "react";

interface Condition {
  id: string;
  name: string;
  description: string;
}

export default function Home() {
  const [quantity, setQuantity] = useState<number>(5);
  const [selectedCondition, setSelectedCondition] =
    useState<string>("none");
  const [generatedNumbers, setGeneratedNumbers] = useState<string[][]>([]);
  const [analysis, setAnalysis] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState<boolean>(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const conditions: Condition[] = useMemo(
    () => [
      {
        id: "none",
        name: "선택 안함",
        description: "모든 번호 조합을 같은 기준으로 생성합니다.",
      },
      {
        id: "noConsecutive4",
        name: "4개 이상 연속번호 제외",
        description:
          "하나의 조합 안에서 번호가 4개 이상 연속되는 경우를 제외합니다.",
      },
    ],
    []
  );

  const handleGenerateNumbers = async () => {
    setIsLoading(true);
    setError(null);
    setIsAnalysisOpen(false);

    try {
      const response = await fetch("/api/generate-lotto", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lotteryType: "lotto645",
          quantity,
          selectedCondition,
          conditions,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error: ${response.status}`);
      }

      const data = await response.json();
      const formattedNumbers = data.generatedNumbers.map(
        (numSet: (string | number)[]) => numSet.map(String)
      );
      setGeneratedNumbers(formattedNumbers);
      setAnalysis(data.analysis || "");
    } catch (err) {
      const error = err as Error;
      console.error("Error generating numbers:", error);
      setError(error.message || "번호 생성 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (numbers: string[], index: number) => {
    try {
      const numbersText = numbers.join(", ");
      await navigator.clipboard.writeText(numbersText);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error("복사 실패:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col items-center py-12 px-4 font-sans">
      {/* 헤더 섹션 */}
      <header className="w-full max-w-lg mb-10 text-center">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl mb-4 shadow-lg">
            <span className="text-2xl font-bold text-white">🎱</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            균등 무작위 로또 번호 생성기
          </h1>
          <p className="text-gray-600 text-lg">
            과거 통계 가중치 없이 역대 1등 조합을 제외하고 뽑는 번호
          </p>
        </div>

        {/* 로또 6/45 배지 */}
        <div className="inline-flex items-center px-4 py-2 bg-yellow-100 border border-yellow-300 rounded-full">
          <span className="text-yellow-800 font-semibold text-sm">
            🎯 로또 6/45
          </span>
        </div>
      </header>

      {/* 메인 컨트롤 패널 */}
      <main className="w-full max-w-lg bg-white shadow-2xl rounded-3xl p-8 space-y-8 border border-gray-100">
        {/* 설정 섹션 */}
        <div className="space-y-6">
          <div>
            <label
              htmlFor="quantity"
              className="block text-base font-semibold text-gray-800 mb-3"
            >
              생성할 번호 수량
            </label>
            <div className="relative">
              <select
                id="quantity"
                name="quantity"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value))}
                className="w-full pl-4 pr-12 py-4 text-lg border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-xl shadow-sm bg-gray-50 hover:bg-white transition-colors duration-200 appearance-none"
              >
                {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                  <option key={num} value={num}>
                    {num}개 번호 생성
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div>
            <label
              htmlFor="condition"
              className="block text-base font-semibold text-gray-800 mb-3"
            >
              생성 조건 설정
            </label>
            <div className="relative">
              <select
                id="condition"
                name="condition"
                value={selectedCondition}
                onChange={(e) => setSelectedCondition(e.target.value)}
                className="w-full pl-4 pr-12 py-4 text-lg border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-xl shadow-sm bg-gray-50 hover:bg-white transition-colors duration-200 appearance-none"
              >
                {conditions.map((cond) => (
                  <option key={cond.id} value={cond.id}>
                    {cond.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
            {selectedCondition !== "none" && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  💡{" "}
                  {
                    conditions.find((c) => c.id === selectedCondition)
                      ?.description
                  }
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 생성 버튼 */}
        <button
          type="button"
          onClick={handleGenerateNumbers}
          disabled={isLoading}
          className="w-full flex justify-center items-center py-5 px-6 border border-transparent rounded-2xl shadow-lg text-lg font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all duration-200 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {isLoading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-6 w-6 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span>번호 생성 중...</span>
            </>
          ) : (
            <>
              <span className="mr-2">🎲</span>
              균등 무작위로 번호 뽑기
            </>
          )}
        </button>

        {/* 에러 메시지 */}
        {error && (
          <div className="p-4 bg-red-50 border-l-4 border-red-400 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-semibold text-red-800">오류 발생</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 생성된 번호 표시 영역 */}
      {generatedNumbers.length > 0 && !error && (
        <section className="w-full max-w-lg mt-10 space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              🎯 생성된 로또 번호
            </h2>
            <p className="text-gray-600">
              과거 출현 기록을 가중치로 쓰지 않고, 역대 1등 조합은 제외했어요
            </p>
          </div>

          {/* 생성 기준 정보 - Accordion */}
          {analysis && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl shadow-sm overflow-hidden">
              <button
                onClick={() => setIsAnalysisOpen(!isAnalysisOpen)}
                className="w-full p-6 text-left hover:bg-blue-100/50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">ⓘ</span>
                    </div>
                    <h3 className="text-lg font-semibold text-blue-900">
                      생성 기준
                    </h3>
                  </div>
                  <svg
                    className={`w-5 h-5 text-blue-600 transition-transform duration-200 ${
                      isAnalysisOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </button>
              {isAnalysisOpen && (
                <div className="px-6 pb-6">
                  <div className="border-t border-blue-200 pt-4">
                    <p className="text-blue-800 leading-relaxed whitespace-pre-line">
                      {analysis}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 번호 카드들 */}
          <div className="space-y-4">
            {generatedNumbers.map((numbers, index) => (
              <div
                key={index}
                className="bg-white shadow-xl rounded-2xl p-6 border border-gray-100 hover:shadow-2xl transition-shadow duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    #{index + 1}번 조합
                  </span>
                  <button
                    onClick={() => copyToClipboard(numbers, index)}
                    className="flex items-center space-x-1 text-gray-400 hover:text-blue-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg p-2"
                    title="번호 복사"
                  >
                    {copiedIndex === index ? (
                      <>
                        <svg
                          className="w-5 h-5 text-green-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="text-xs text-green-500 font-medium">
                          복사됨!
                        </span>
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                        <span className="text-xs font-medium">복사</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="flex items-center justify-center space-x-3">
                  {numbers.map((num, numIndex) => (
                    <div
                      key={numIndex}
                      className="flex items-center justify-center w-12 h-12 text-xl font-bold rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-lg transform hover:scale-110 transition-transform duration-200"
                    >
                      {num}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 푸터 */}
      <footer className="mt-16 text-center text-sm text-gray-500 w-full max-w-lg space-y-2">
        <div className="border-t border-gray-200 pt-8">
          <p className="font-semibold">
            &copy; {new Date().getFullYear()} 균등 무작위 로또 번호 생성기
          </p>
          <p className="text-xs leading-relaxed">
            본 서비스는 과거 당첨 통계를 예측 신호로 사용하지 않으며, 역대
            1등 조합과 같은 조합만 제외합니다. 실제 당첨을 보장하지 않습니다.
            <br />
            재미와 참고 목적으로만 사용해주세요. 🍀
          </p>
        </div>
      </footer>
    </div>
  );
}
