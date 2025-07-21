"use client";

import { useState } from "react";
import { basicPrompt } from "@/server/actions/basicPrompt";
import PromptInput from "./PromptInput";
import PromptResponse from "./PromptResponse";

const BasicPrompt = () => {
  const [response, setResponse] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const handleSubmit = async (prompt: string) => {
    setIsLoading(true);
    setResponse("");
    setError("");

    try {
      const result = await basicPrompt(prompt);
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
      <div>
        <p className="mb-4 text-sm text-muted-foreground">
          Enter a prompt below to test it with the AI model.
        </p>
        <PromptInput onSubmit={handleSubmit} loading={isLoading} />
      </div>

      <PromptResponse
        data={response}
        loading={isLoading}
        error={error}
        title="AI Response"
      />
    </div>
  );
};

export default BasicPrompt;
