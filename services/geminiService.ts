import { GoogleGenAI } from "@google/genai";
import { MODEL_TEXT } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Translate Text
export const translateText = async (
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string> => {
  if (!text.trim()) return "";
  
  const prompt = `Translate the following text from ${sourceLang} to ${targetLang}. Only provide the translated text without any explanations.
  
  Text:
  ${text}`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_TEXT,
      contents: [{ parts: [{ text: prompt }] }],
    });
    return response.text || "";
  } catch (error) {
    console.error("Translation error:", error);
    throw new Error("Failed to translate text.");
  }
};

// Transcribe File (Audio/Video/PDF/Image) to Text
export const fileToText = async (
  base64Data: string,
  mimeType: string,
  targetLangCode: string
): Promise<string> => {
  const isAudioVideo = mimeType.startsWith('audio/') || mimeType.startsWith('video/');
  
  let prompt = "Analyze the provided file and extract all text content from it. Maintain the original formatting as much as possible.";
  
  if (isAudioVideo) {
    // Requirement: Chinese audio to Simplified Chinese
    prompt = `Transcribe the audio/video content into text. If the audio is in Chinese, transcribe it strictly into Simplified Chinese. If it is another language, transcribe it in that language.`;
  } else if (mimeType === 'application/pdf') {
     prompt = "Extract all text from this PDF document.";
  }

  try {
    // Construct the parts array strictly
    const parts = [
      {
        inlineData: {
          mimeType: mimeType,
          data: base64Data,
        },
      },
      { text: prompt },
    ];

    const response = await ai.models.generateContent({
      model: MODEL_TEXT,
      contents: [{ parts: parts }],
    });

    return response.text || "";
  } catch (error) {
    console.error("File processing error details:", error);
    throw new Error("Failed to process file with Gemini API.");
  }
};

// URL to Text (using Grounding or simple extraction prompt)
export const urlToText = async (url: string): Promise<string> => {
    const prompt = `Access the following URL: ${url}. 
    Extract the main content (text or transcript of audio/video) from this page. 
    Return ONLY the extracted content.`;

    try {
        const response = await ai.models.generateContent({
            model: MODEL_TEXT,
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                tools: [{ googleSearch: {} }] // Use search to help access/verify content if needed
            }
        });
        
        // Grounding response handling
        const text = response.text;
        if (!text) {
             throw new Error("No content found.");
        }
        return text;
    } catch (error) {
        console.error("URL processing error:", error);
        throw new Error("Failed to extract content from URL.");
    }
};
