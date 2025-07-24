"use client";

import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface PromptInputProps {
  onPromptChange?: (value: string) => void;
  onSubmit?: (prompt: string) => void;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
  loading?: boolean;
}

export default function PromptInput({
  onPromptChange,
  onSubmit = (prompt) => console.log("Submitted prompt:", prompt),
  placeholder = "Write your input here... For example: 'Generate a creative story about a space explorer discovering a new planet.'",
  maxLength = 2000,
  disabled = false,
  loading = false,
}: PromptInputProps) {
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;

    // Clear error when user starts typing
    if (error) setError("");

    // Enforce character limit (prevent typing beyond limit)
    if (value.length <= maxLength) {
      setPrompt(value);
      onPromptChange?.(value);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!prompt.trim()) {
      setError("Please enter an input");
      return;
    }

    setError("");
    onSubmit(prompt.trim());
  };

  const remainingChars = maxLength - prompt.length;
  const isNearLimit = remainingChars < 100;
  const isValid = prompt.trim().length > 0;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 p-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="prompt" className="mb-3">
            Enter your input
          </Label>
          <div className="relative">
            <Textarea
              id="prompt"
              value={prompt}
              onChange={handleInputChange}
              placeholder={placeholder}
              disabled={disabled || loading}
              className={cn(
                "min-h-32 resize-none",
                error &&
                  "border-red-300 dark:border-red-600 focus-visible:ring-red-500/50 bg-red-50 dark:bg-red-900/10",
                (disabled || loading) && "opacity-50 cursor-not-allowed"
              )}
              rows={4}
            />
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-slate-800/80 rounded-lg">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>

          {/* Character count and error display */}
          <div className="flex justify-between items-center mt-2">
            <div className="text-sm">
              {error && (
                <span className="text-red-600 dark:text-red-400 flex items-center gap-1">
                  <span>⚠️</span>
                  {error}
                </span>
              )}
            </div>
            <div
              className={cn(
                "text-sm",
                isNearLimit
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-muted-foreground"
              )}
            >
              {remainingChars} characters remaining
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <Button
            type="submit"
            disabled={!isValid || disabled || loading}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Processing...
              </span>
            ) : (
              "Test Prompt"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
