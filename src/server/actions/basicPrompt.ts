"use server";

import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

const template = `You are a helpful assistant that can answer questions and help with tasks. Answer the user's question or task in a concise and helpful manner.\n\n`;

export async function basicPrompt(prompt: string) {
  const response = await generateText({
    model: openai("gpt-4o-mini"),
    prompt: template + prompt,
  });
  return response.text;
}
