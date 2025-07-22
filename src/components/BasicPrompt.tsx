"use client";

import { useState } from "react";
import PromptInput from "./PromptInput";
import MultiplePromptResponse, {
  MultiplePromptResults,
} from "./MultiplePromptResponse";
import { multipleBasicPrompts } from "@/server/actions/basicPrompt";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { PromptTemplate } from "@/server/db/promptTemplates";

// TODO: instead of taking in the prompt templates for the db, it should take in an array of prompt template functions, which take in the user input.
// those function should have the same return type as the multipleBasicPrompts function.
// this gives more flexibility. i can have basic prompt tempaltes which are just strings, eventually stored in the db.
// i can also have more complex prompts which are chains of prompts of any kind, which is a function that gets called with the user input.
// this translation / grouping to an array of functions should be done in BasicPromptWrapper

interface BasicPromptProps {
  promptTemplates: PromptTemplate[];
}

const BasicPrompt = ({ promptTemplates }: BasicPromptProps) => {
  const [response, setResponse] = useState<MultiplePromptResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [selectedPromptId, setSelectedPromptId] = useState<number>(1);
  const [runCount, setRunCount] = useState<number>(1);

  const handleSubmit = async (prompt: string) => {
    setIsLoading(true);
    setResponse(null);
    setError("");

    try {
      const result = await multipleBasicPrompts({
        promptId: selectedPromptId,
        input: prompt,
        runCount: runCount,
      });
      setResponse(result);
    } catch (err) {
      setError("Failed to get response from AI");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="prompt-template-select">Prompt Template</Label>
        <Select
          value={selectedPromptId.toString()}
          onValueChange={(value) => setSelectedPromptId(parseInt(value))}
        >
          <SelectTrigger id="prompt-template-select">
            <SelectValue placeholder="Select a prompt template" />
          </SelectTrigger>
          <SelectContent>
            {promptTemplates.map((template) => (
              <SelectItem key={template.id} value={template.id.toString()}>
                {template.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="run-count-select">Number of Runs</Label>
        <Select
          value={runCount.toString()}
          onValueChange={(value) => setRunCount(parseInt(value))}
        >
          <SelectTrigger id="run-count-select">
            <SelectValue placeholder="Select number of runs" />
          </SelectTrigger>
          <SelectContent>
            {[1, 2, 3, 4, 5].map((count) => (
              <SelectItem key={count} value={count.toString()}>
                {count === 1 ? "1 run" : `${count} runs`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <PromptInput onSubmit={handleSubmit} disabled={isLoading} />

      <MultiplePromptResponse
        data={response}
        loading={isLoading}
        error={error}
        title={runCount === 1 ? "AI Response" : "AI Responses"}
      />
    </div>
  );
};

export function BasicPromptLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-20 w-full bg-slate-200 dark:bg-slate-700" />
      <Skeleton className="h-40 w-full bg-slate-200 dark:bg-slate-700" />
      <Skeleton className="h-60 w-full bg-slate-200 dark:bg-slate-700" />
    </div>
  );
}

export default BasicPrompt;
