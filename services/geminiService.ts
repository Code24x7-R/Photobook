
import { GoogleGenAI, Type } from "@google/genai";
import type { GenerateContentResponse } from "@google/genai";

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

export const generatePhotoDetails = async (imageFile: File): Promise<{title: string, caption: string, album: string, tags: string[]}> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const imagePart = await fileToGenerativePart(imageFile);
    const prompt = "Generate a short, creative title, a one-paragraph caption, a one-or-two-word subject for categorization (e.g., 'Nature', 'Family'), and a list of 3-5 relevant tags (e.g., 'sunset', 'beach', 'vacation') for this photo.";

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, { text: prompt }] },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    title: {
                        type: Type.STRING,
                        description: 'A short, creative title for the photo.'
                    },
                    caption: {
                        type: Type.STRING,
                        description: 'A thoughtful, paragraph-length caption for the photo.'
                    },
                    album: {
                        type: Type.STRING,
                        description: 'A one-or-two-word subject for photo categorization.'
                    },
                    tags: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: 'An array of 3-5 relevant tags for the photo.'
                    }
                },
                required: ['title', 'caption', 'album', 'tags']
            }
        }
    });
    
    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText);
    
    if (typeof result.title === 'string' && typeof result.caption === 'string' && typeof result.album === 'string' && Array.isArray(result.tags)) {
        return result;
    } else {
        throw new Error("Invalid response format from AI.");
    }

  } catch (error) {
    console.error("Error generating content:", error);
    if (error instanceof SyntaxError) {
        throw new Error("Failed to parse AI response. The format was not valid JSON.");
    }
    throw new Error("Failed to generate content from AI. Please try again.");
  }
};