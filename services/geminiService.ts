import { GoogleGenAI, Type } from "@google/genai";
import { AISummary } from "../types";

const GEMINI_API_KEY = process.env.API_KEY || '';

// Mock response for when API key is missing or for demo purposes
const MOCK_SUMMARY: AISummary = {
  tags: ['动画', '自然', '兔八哥', '高清', '测试视频'],
  summary: "这是一个经典的开源测试视频《Big Buck Bunny》。视频展示了一只巨大的兔子在森林中的冒险，画面精美，常用于测试视频编码和流媒体播放功能。",
  sentiment: "积极幽默",
};

export const analyzeVideoMetadata = async (title: string, platform: string): Promise<AISummary> => {
  if (!GEMINI_API_KEY) {
    console.warn("No Gemini API Key found. Using mock data.");
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    return MOCK_SUMMARY;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    
    const prompt = `
      Analyze the following video metadata and provide a summary in Chinese.
      Video Title: "${title}"
      Platform: "${platform}"

      Please generate:
      1. A list of 5 relevant hashtags/tags.
      2. A short, engaging summary (max 100 words).
      3. The general sentiment of the content.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of relevant tags"
            },
            summary: {
              type: Type.STRING,
              description: "A short summary in Chinese"
            },
            sentiment: {
              type: Type.STRING,
              description: "General sentiment of the video"
            }
          },
          required: ["tags", "summary", "sentiment"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as AISummary;
    }
    
    throw new Error("Empty response from Gemini");

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    return MOCK_SUMMARY;
  }
};
