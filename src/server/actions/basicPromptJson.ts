"use server";

import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

const template = `You are a helpful assistant that can answer questions and help with tasks. Answer the user's question or task in a concise and helpful manner.\n\n`;

export async function basicPromptJson(userInput: string) {
  const fullPrompt = template + userInput;

  const response = await generateObject({
    model: openai("gpt-4o-mini"),
    prompt: fullPrompt,
    temperature: 1,
    schema: z.object({
      answer: z.string().describe("The answer to the user's question"),
      reasoning: z.string().describe("The reasoning behind the answer"),
    }),
  });

  return {
    response: response.object,
    prompt: fullPrompt,
  };
}
