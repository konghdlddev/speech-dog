import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.GEMINI_API_KEY;
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent";

export async function POST(request: NextRequest) {
  try {
    const { text, voiceId } = await request.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const voiceName = voiceId || "Kore";

    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text }],
          },
        ],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName,
              },
            },
          },
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Gemini TTS Error:", errorData);
      return NextResponse.json(
        { error: errorData.error?.message || "TTS request failed" },
        { status: response.status }
      );
    }

    const data = await response.json();
    const audioData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData;

    if (!audioData?.data) {
      return NextResponse.json(
        { error: "No audio data in response" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      audio: audioData.data,
      mimeType: audioData.mimeType || "audio/L16;rate=24000",
    });
  } catch (error) {
    console.error("TTS Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "TTS failed" },
      { status: 500 }
    );
  }
}
