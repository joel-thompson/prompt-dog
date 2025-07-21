"use server";

import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import getPromptTemplates from "../db/promptTemplates";
import insertInputIntoPrompt from "../insertInputIntoPrompt";

export async function basicPrompt(promptId: number, input: string) {
  const template = getPromptTemplates().find((p) => p.id === promptId)?.text;
  if (!template) {
    return "Prompt not found";
  }
  const prompt = insertInputIntoPrompt(template, input);
  const response = await generateText({
    model: openai("gpt-4o-mini"),
    prompt: prompt,
  });
  return response.text;
}
