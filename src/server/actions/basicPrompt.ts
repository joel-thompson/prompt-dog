"use server";

import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { getPromptTemplate } from "../db/promptTemplates";
import insertInputIntoPrompt from "../insertInputIntoPrompt";

interface PromptResult {
  response: string;
  prompt: string;
  duration: number;
  timestamp: Date;
}

interface MultiplePromptResults {
  results: PromptResult[];
  totalDuration: number;
  promptTemplate: string;
  userInput: string;
}

export async function basicPrompt(
  promptId: number,
  input: string
): Promise<string> {
  const template = (await getPromptTemplate(promptId))?.text;
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

export async function multipleBasicPrompts({
  promptId,
  input,
  runCount = 1,
}: {
  promptId: number;
  input: string;
  runCount?: number;
}): Promise<MultiplePromptResults> {
  const template = (await getPromptTemplate(promptId))?.text;
  if (!template) {
    throw new Error("Prompt not found");
  }

  const prompt = insertInputIntoPrompt(template, input);
  const results: PromptResult[] = [];
  const startTime = Date.now();

  for (let i = 0; i < runCount; i++) {
    const runStartTime = Date.now();

    try {
      const response = await generateText({
        model: openai("gpt-4o-mini"),
        prompt: prompt,
      });

      const runEndTime = Date.now();
      const duration = runEndTime - runStartTime;

      results.push({
        response: response.text,
        prompt: prompt,
        duration: duration,
        timestamp: new Date(runStartTime),
      });
    } catch (error) {
      const runEndTime = Date.now();
      const duration = runEndTime - runStartTime;

      results.push({
        response: `Error: ${
          error instanceof Error ? error.message : "Unknown error occurred"
        }`,
        prompt: prompt,
        duration: duration,
        timestamp: new Date(runStartTime),
      });
    }
  }

  const totalDuration = Date.now() - startTime;

  return {
    results,
    totalDuration,
    promptTemplate: template,
    userInput: input,
  };
}
