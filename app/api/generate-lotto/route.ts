import { NextResponse } from "next/server";
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  GenerationConfig,
  SafetySetting,
} from "@google/generative-ai";
import { getLottoPrompt } from "./promptContent"; // 프롬프트 파일 import

const MODEL_NAME = "gemini-1.5-flash-latest"; // 최신 모델 사용 또는 "gemini-pro"

interface RequestBody {
  lotteryType: "lotto645" | "pension";
  quantity: number;
  selectedCondition: string;
  conditions: { id: string; name: string; description: string }[];
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY is not set");
      return NextResponse.json(
        { error: "API 키가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const body: RequestBody = await request.json();
    const { lotteryType, quantity, selectedCondition, conditions } = body;

    const selectedConditionDetail = conditions.find(
      (c) => c.id === selectedCondition
    );
    const conditionDescription = selectedConditionDetail
      ? selectedConditionDetail.description
      : "특별한 조건 없음";

    const lottoTypeDescription =
      lotteryType === "lotto645"
        ? "로또 6/45 (1부터 45까지의 숫자 6개)"
        : "연금복권 720+ (1조부터 5조까지의 조 번호 1개와 0부터 9까지의 6자리 숫자)";

    // JSON.stringify를 사용하여 특수문자 포함 가능성이 있는 설명을 안전하게 처리
    const safeConditionDescription = JSON.stringify(conditionDescription);
    const conditionStipulation =
      conditionDescription !== "특별한 조건 없음"
        ? `- 주어진 조건(${safeConditionDescription})을 반드시 만족해야 합니다.`
        : "";

    const prompt = getLottoPrompt(
      lottoTypeDescription,
      quantity,
      safeConditionDescription,
      conditionStipulation
    );
    // console.log("Constructed Prompt:", prompt); // 디버깅용

    const generationConfig: GenerationConfig = {
      temperature: 0.9,
      topK: 1,
      topP: 1,
      maxOutputTokens: 2048,
    };

    const safetySettings: SafetySetting[] = [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ];

    const chat = model.startChat({
      generationConfig,
      safetySettings,
      history: [],
    });

    const result = await chat.sendMessage(prompt);
    const response = result.response;
    let text = response.text();

    // console.log("Gemini Raw Response Text:", text); // 디버깅용

    // 마크다운 코드 블록 제거 로직 수정
    // 1. 앞부분의 ```json 또는 ``` 제거
    if (text.startsWith("```json")) {
      text = text.substring(text.indexOf("\n") + 1); // ```json 다음 줄부터 시작
    } else if (text.startsWith("```")) {
      text = text.substring(3); // ``` 다음부터 시작
    }

    // 2. 뒷부분의 ``` 제거 (앞뒤 공백도 함께 제거)
    text = text.trim(); // 먼저 앞뒤 공백 제거
    if (text.endsWith("```")) {
      text = text.substring(0, text.length - 3); // 마지막 ``` 제거
    }
    text = text.trim(); // 다시 한번 앞뒤 공백 제거

    // console.log("Cleaned Text for JSON Parsing:", text); // 디버깅용

    let generatedNumbers;
    try {
      generatedNumbers = JSON.parse(text);
      if (
        !Array.isArray(generatedNumbers) ||
        !generatedNumbers.every(
          (numArray) =>
            Array.isArray(numArray) &&
            numArray.every(
              (num) => typeof num === "number" || typeof num === "string"
            )
        )
      ) {
        console.error(
          "Parsed data is not a valid array of (number or string) arrays:",
          generatedNumbers
        );
        throw new Error(
          "API 응답이 예상된 숫자/문자열 배열의 배열 형식이 아닙니다."
        );
      }
    } catch (parseError: unknown) {
      const error = parseError as Error;
      console.error("Error parsing Gemini response:", error);
      console.error(
        "Original text from Gemini (before cleaning):",
        response.text()
      );
      console.error("Cleaned text (at parsing error):", text);
      return NextResponse.json(
        {
          error: "Gemini API 응답을 파싱하는 중 오류가 발생했습니다.",
          details: text,
          error_message: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ generatedNumbers });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Error in generate-lotto API:", err);
    const errorMessage = err.message || String(err);
    // Gemini API 자체에서 발생한 오류일 경우, 그 내용을 포함할 수 있도록 처리
    // if (err.response && err.response.data) { // err 객체에 response 속성이 있는지 확인 필요
    //     console.error("Gemini API Error Data:", err.response.data);
    // }
    return NextResponse.json(
      {
        error: "로또 번호 생성 중 서버 오류가 발생했습니다.",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
