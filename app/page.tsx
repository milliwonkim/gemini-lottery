"use client";

import { useState, useMemo, useEffect } from "react";

type LotteryType = "lotto645" | "pension";
interface Condition {
  id: string;
  name: string;
  description: string;
}

export default function Home() {
  const [lotteryType, setLotteryType] = useState<LotteryType>("lotto645");
  const [quantity, setQuantity] = useState<number>(5);
  const [selectedCondition, setSelectedCondition] =
    useState<string>("noConsecutive4");
  const [generatedNumbers, setGeneratedNumbers] = useState<string[][]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setGeneratedNumbers([]);
    setError(null);
  }, [lotteryType]);

  const conditions: Condition[] = useMemo(
    () => [
      {
        id: "none",
        name: "선택 안함",
        description: "특별한 조건 없이 번호를 생성합니다.",
      },
      {
        id: "noConsecutive4",
        name: "4개 이상 연속번호 제외",
        description:
          "역대 당첨번호와 연속적으로 4개 이상 일치하는 경우를 제외합니다.",
      },

      // TODO: 향후 다양한 조건 추가
    ],
    []
  );

  const handleGenerateNumbers = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/generate-lotto", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lotteryType,
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
    } catch (err) {
      const error = err as Error;
      console.error("Error generating numbers:", error);
      setError(error.message || "번호 생성 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4 font-sans">
      <header className="w-full max-w-md mb-8">
        <h1 className="text-3xl font-bold text-center text-gray-800">
          Gemini 로또 번호 생성
        </h1>
      </header>

      <main className="w-full max-w-md bg-white shadow-lg rounded-xl p-6 space-y-6">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setLotteryType("lotto645")}
            className={`flex-1 py-3 text-center font-semibold 
                        ${
                          lotteryType === "lotto645"
                            ? "border-b-2 border-blue-600 text-blue-600"
                            : "text-gray-500 hover:bg-gray-100"
                        }
                        transition-colors duration-150 ease-in-out focus:outline-none rounded-t-md`}
          >
            로또 6/45
          </button>
          <button
            onClick={() => setLotteryType("pension")}
            className={`flex-1 py-3 text-center font-semibold 
                        ${
                          lotteryType === "pension"
                            ? "border-b-2 border-blue-600 text-blue-600"
                            : "text-gray-500 hover:bg-gray-100"
                        }
                        transition-colors duration-150 ease-in-out focus:outline-none rounded-t-md`}
          >
            연금복권 720+
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="quantity"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              생성 수량
            </label>
            <select
              id="quantity"
              name="quantity"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value))}
              className="mt-1 block w-full pl-3 pr-10 py-2.5 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg shadow-sm bg-gray-50"
            >
              {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                <option key={num} value={num}>
                  {num}개
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="condition"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              생성 조건 (선택)
            </label>
            <select
              id="condition"
              name="condition"
              value={selectedCondition}
              onChange={(e) => setSelectedCondition(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2.5 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg shadow-sm bg-gray-50"
            >
              {conditions.map((cond) => (
                <option key={cond.id} value={cond.id}>
                  {cond.name}
                </option>
              ))}
            </select>
            {selectedCondition !== "none" && (
              <p className="mt-2 text-xs text-gray-500">
                {
                  conditions.find((c) => c.id === selectedCondition)
                    ?.description
                }
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={handleGenerateNumbers}
          disabled={isLoading}
          className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-md text-base font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <svg
                className="animate-spin -mr-1 ml-3 h-5 w-5 text-white"
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
              <span className="ml-2">생성 중...</span>
            </>
          ) : (
            "번호 생성하기"
          )}
        </button>

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-300 rounded-lg">
            <p className="text-sm font-semibold text-red-700">오류 발생:</p>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
        )}
      </main>

      {generatedNumbers.length > 0 && !error && (
        <section className="w-full max-w-md mt-8 space-y-4">
          <h2 className="text-xl font-semibold text-gray-700 text-center mb-4">
            생성된 번호
          </h2>
          {generatedNumbers.map((numbers, index) => (
            <div
              key={index}
              className="bg-white shadow-lg rounded-xl p-5 flex items-center justify-center space-x-2 min-h-[70px]"
            >
              {lotteryType === "lotto645"
                ? numbers.map((num, numIndex) => (
                    <span
                      key={numIndex}
                      className="flex items-center justify-center w-10 h-10 text-lg font-bold rounded-full bg-yellow-400 text-yellow-900 shadow-sm"
                    >
                      {num}
                    </span>
                  ))
                : numbers.length > 0 && (
                    <div className="flex items-center justify-center space-x-1.5">
                      <span className="px-3 py-1.5 text-lg font-bold rounded-lg bg-sky-500 text-white shadow-sm">
                        {numbers[0]}조
                      </span>
                      <span className="text-2xl font-mono font-bold tracking-wider text-gray-700">
                        {numbers.slice(1).join("")}
                      </span>
                    </div>
                  )}
            </div>
          ))}
        </section>
      )}

      <footer className="mt-12 text-center text-xs text-gray-400 w-full max-w-md">
        <p>
          &copy; {new Date().getFullYear()} Gemini Lottery App. All rights
          reserved.
        </p>
        <p className="mt-1">
          본 서비스는 실제 당첨을 보장하지 않으며, 재미와 참고 목적으로만
          사용해주세요.
        </p>
      </footer>
    </div>
  );
}
