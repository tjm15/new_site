import { GoogleGenAI } from "@google/genai";

export async function callGemini(prompt: string): Promise<string> {
  try {
    const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error("Gemini API key not found. Please set GEMINI_API_KEY environment variable.");
    }
    
    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: {
        parts: [{ text: prompt }]
      }
    });
    
    return response.text || "No response generated.";
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    if (error.message?.includes('API key')) {
      return "Error: API key configuration issue. Please contact the administrator.";
    }
    
    if (error.message?.includes('quota') || error.message?.includes('limit')) {
      return "Error: API quota exceeded. Please try again later.";
    }
    
    return `Error generating response: ${error.message || "Unknown error occurred"}`;
  }
}

export async function callGeminiImage(prompt: string): Promise<string | null> {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
      throw new Error("Gemini API key not found");
    }
    
    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        aspectRatio: "16:9"
      }
    });

    if (response?.generatedImages?.[0]?.image?.imageBytes) {
      const base64 = response.generatedImages[0].image.imageBytes;
      return `data:image/png;base64,${base64}`;
    }
    
    return null;
  } catch (error: any) {
    console.error("Gemini Image API Error:", error);
    return null;
  }
}
