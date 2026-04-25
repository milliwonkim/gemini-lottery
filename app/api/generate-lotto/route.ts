import { NextResponse } from "next/server";
import { generateLotto645 } from "./lotto645";

interface RequestBody {
  lotteryType: "lotto645";
  quantity: number;
  selectedCondition: string;
  conditions: { id: string; name: string; description: string }[];
}

export async function POST(request: Request) {
  try {
    const body: RequestBody = await request.json();
    const { lotteryType, quantity, selectedCondition } = body;

    if (lotteryType !== "lotto645") {
      return NextResponse.json(
        { error: "지원하지 않는 로또 유형입니다." },
        { status: 400 }
      );
    }

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
      return NextResponse.json(
        { error: "1 이상 10 이하의 수량을 입력해주세요." },
        { status: 400 }
      );
    }

    const condition: "none" | "noConsecutive4" =
      selectedCondition === "noConsecutive4" ? "noConsecutive4" : "none";

    const { generatedNumbers, analysis } = await generateLotto645(
      quantity,
      condition
    );

    return NextResponse.json({
      generatedNumbers,
      analysis,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Error in generate-lotto API:", err);
    const errorMessage = err.message || String(err);
    return NextResponse.json(
      {
        error: "로또 번호 생성 중 서버 오류가 발생했습니다.",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
