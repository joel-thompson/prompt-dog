"use client";

import { useState } from "react";
import PromptInput from "./PromptInput";
import MultiplePromptResponse from "./MultiplePromptResponse";
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

interface PromptTemplate {
  id: number;
  name: string;
  text: string;
}

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

      <PromptInput onSubmit={handleSubmit} loading={isLoading} />

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
      {/* Prompt Template Section Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" /> {/* Label skeleton */}
        <Skeleton className="h-10 w-full" /> {/* Select skeleton */}
      </div>

      {/* Run Count Section Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" /> {/* Label skeleton */}
        <Skeleton className="h-10 w-full" /> {/* Select skeleton */}
      </div>

      {/* Prompt Input Section Skeleton - matching PromptInput card styling */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 p-8">
        <div className="space-y-6">
          <div>
            <Skeleton className="h-4 w-32 mb-3" />{" "}
            {/* "Enter your input" label */}
            <Skeleton className="h-32 w-full rounded-lg" />{" "}
            {/* Textarea skeleton */}
            {/* Character count skeleton */}
            <div className="flex justify-between items-center mt-2">
              <div /> {/* Empty space for error messages */}
              <Skeleton className="h-4 w-40" /> {/* Character count */}
            </div>
          </div>

          {/* Submit button skeleton - centered */}
          <div className="flex justify-center">
            <Skeleton className="h-11 w-32 rounded-md" /> {/* Submit button */}
          </div>
        </div>
      </div>

      {/* Response Section Skeleton - matching PromptResponse card styling */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 p-8">
        <div className="space-y-4">
          <Skeleton className="h-4 w-24" /> {/* "AI Response" title */}
          <div className="min-h-16 flex items-center justify-center py-8">
            <Skeleton className="h-4 w-32" />{" "}
            {/* "No response yet" placeholder */}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BasicPrompt;
