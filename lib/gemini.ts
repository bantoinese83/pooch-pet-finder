import { GoogleGenAI, createUserContent } from "@google/genai"

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY })

export async function generatePetDescriptionFromImage(base64Image: string) {
  const result = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Image,
        },
      },
      { text: "Describe this pet for a lost/found pet report. Include breed, color, markings, and any unique features. Suggest 2-4 tags as a comma-separated list." },
    ],
  })
  return result.text
}

export async function generateCommunityPostSuggestion(prompt: string) {
  const result = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: prompt,
    config: {
      systemInstruction: "You are a helpful assistant for a lost/found pet community board. Suggest a friendly, clear post based on the user's input.",
      temperature: 0.7,
    },
  })
  return result.text
}

export async function summarizeText(text: string) {
  const result = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: `Summarize this for quick reading: ${text}`,
    config: { temperature: 0.2 },
  })
  return result.text
}

export async function askGeminiFAQ(question: string) {
  const result = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: question,
    config: {
      systemInstruction: "You are a helpful assistant for a lost/found pet platform. Answer user questions using the FAQ and blog content.",
      temperature: 0.2,
    },
  })
  return result.text
}

export async function generateMatchExplanation(matchData: any) {
  const result = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: `Explain in friendly language why these two pets are a match: ${JSON.stringify(matchData)}`,
    config: { temperature: 0.3 },
  })
  return result.text
}

export async function generateImageCaption(base64Image: string) {
  const result = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Image,
        },
      },
      { text: "Write a concise, descriptive alt text for this pet photo." },
    ],
  })
  return result.text
}

export async function generateShareText(context: string) {
  const result = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: `Write a catchy, helpful social share message for this: ${context}`,
    config: { temperature: 0.7 },
  })
  return result.text
}

export async function summarizeFeedback(feedbackList: string[]) {
  const result = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: `Summarize and highlight common themes in this user feedback: ${feedbackList.join("\n")}`,
    config: { temperature: 0.3 },
  })
  return result.text
} 