"use client";

import { useState } from "react";
import PromptInput from "./PromptInput";
import PromptResponse from "./PromptResponse";
import { basicPrompt } from "@/server/actions/basicPrompt";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface PromptTemplate {
  id: number;
  name: string;
  text: string;
}

interface BasicPromptProps {
  promptTemplates: PromptTemplate[];
}

const BasicPrompt = ({ promptTemplates }: BasicPromptProps) => {
  const [response, setResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [selectedPromptId, setSelectedPromptId] = useState<number>(1);

  const handleSubmit = async (prompt: string) => {
    setIsLoading(true);
    setResponse(null);
    setError("");

    try {
      const result = await basicPrompt(selectedPromptId, prompt);
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

      <PromptInput onSubmit={handleSubmit} loading={isLoading} />

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
