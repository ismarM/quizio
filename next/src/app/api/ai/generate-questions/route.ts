import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth/server-auth";

export const runtime = "nodejs";

type GenerateQuestionsRequest = {
  prompt: string;
  quizTitle?: string;
  count?: number;
};

type GeneratedAnswer = {
  text: string;
  isCorrect: boolean;
};

type GeneratedQuestion = {
  title: string;
  points: number;
  answers: GeneratedAnswer[];
};

type GenerateQuestionsResponse = {
  questions: GeneratedQuestion[];
};

const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash-lite";

const SYSTEM_PROMPT = `You are a quiz question generator. When given a topic and instructions, you generate quiz questions with multiple choice answers.

RULES:
- Always respond with ONLY valid JSON, no markdown, no backticks, no preamble
- Each question must have exactly 4 answers
- Exactly 1 answer must be correct (isCorrect: true), the rest false
- Question titles should be clear and unambiguous
- Answers should be plausible (wrong answers should not be obviously wrong)
- Points should be between 1 and 10 based on difficulty
- Generate the number of questions requested

RESPONSE FORMAT (JSON only, no other text):
{
  "questions": [
    {
      "title": "Question text here?",
      "points": 5,
      "answers": [
        { "text": "Answer A", "isCorrect": true },
        { "text": "Answer B", "isCorrect": false },
        { "text": "Answer C", "isCorrect": false },
        { "text": "Answer D", "isCorrect": false }
      ]
    }
  ]
}`;

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!user.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Set GEMINI_API_KEY in next/.env.local. Never expose it as NEXT_PUBLIC_*.
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not set");
    return NextResponse.json(
      { error: "AI generation is not configured." },
      { status: 503 }
    );
  }
  const model = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;

  let body: GenerateQuestionsRequest;
  try {
    body = (await request.json()) as GenerateQuestionsRequest;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }

  const { prompt, quizTitle, count = 5 } = body;

  if (!prompt || typeof prompt !== "string" || prompt.trim().length < 3) {
    return NextResponse.json(
      { error: "Prompt is required (min 3 characters)." },
      { status: 400 }
    );
  }

  const safeCount = Math.min(Math.max(1, Math.round(Number(count) || 5)), 20);
  const safeQuizTitle =
    typeof quizTitle === "string" && quizTitle.trim()
      ? quizTitle.trim()
      : undefined;

  const userMessage = safeQuizTitle
    ? `Quiz title: "${safeQuizTitle}"\n\nGenerate ${safeCount} questions: ${prompt.trim()}`
    : `Generate ${safeCount} questions: ${prompt.trim()}`;

  try {
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: SYSTEM_PROMPT }],
          },
          contents: [
            {
              role: "user",
              parts: [{ text: userMessage }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4096,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorBody = await geminiResponse.text();
      console.error("Gemini API error:", geminiResponse.status, errorBody);
      return NextResponse.json(
        { error: "AI service returned an error. Please try again." },
        { status: 502 }
      );
    }

    const geminiData = await geminiResponse.json();
    const rawText: string =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    if (!rawText) {
      return NextResponse.json(
        { error: "AI returned an empty response. Please try again." },
        { status: 502 }
      );
    }

    const cleaned = rawText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    let parsed: GenerateQuestionsResponse;
    try {
      parsed = JSON.parse(cleaned) as GenerateQuestionsResponse;
    } catch {
      console.error("Failed to parse Gemini response as JSON:", rawText);
      return NextResponse.json(
        { error: "AI returned an unexpected format. Please try again." },
        { status: 502 }
      );
    }

    const questions = validateAndSanitize(parsed?.questions);
    if (questions.length === 0) {
      return NextResponse.json(
        {
          error:
            "AI could not generate valid questions. Try a different prompt.",
        },
        { status: 422 }
      );
    }

    return NextResponse.json({ questions } satisfies GenerateQuestionsResponse);
  } catch (error) {
    console.error("AI generation error:", error);
    return NextResponse.json(
      { error: "Failed to connect to AI service. Please try again." },
      { status: 502 }
    );
  }
}

function validateAndSanitize(raw: unknown): GeneratedQuestion[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .filter(
      (item): item is Record<string, unknown> =>
        typeof item === "object" && item !== null
    )
    .map((item) => {
      const title = typeof item.title === "string" ? item.title.trim() : "";
      const points =
        typeof item.points === "number" && item.points > 0
          ? Math.min(Math.max(Math.round(item.points), 1), 10)
          : 5;

      const rawAnswers = Array.isArray(item.answers) ? item.answers : [];
      const answers = rawAnswers
        .filter(
          (answer): answer is Record<string, unknown> =>
            typeof answer === "object" && answer !== null
        )
        .map((answer) => ({
          text: typeof answer.text === "string" ? answer.text.trim() : "",
          isCorrect: Boolean(answer.isCorrect),
        }))
        .filter((answer) => answer.text.length > 0)
        .slice(0, 4);

      const firstCorrectIndex = answers.findIndex((answer) => answer.isCorrect);
      const normalizedAnswers = answers.map((answer, index) => ({
        ...answer,
        isCorrect: index === (firstCorrectIndex >= 0 ? firstCorrectIndex : 0),
      }));

      return { title, points, answers: normalizedAnswers };
    })
    .filter((question) => question.title.length > 0 && question.answers.length === 4);
}
