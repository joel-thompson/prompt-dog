"use server";

import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

export async function generateAIResponse(prompt: string): Promise<string> {
  const response = await generateText({
    model: openai("gpt-4o-mini"),
    prompt: prompt,
  });
  return response.text;
}
