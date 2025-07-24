import { Suspense } from "react";

import getPromptTemplates from "@/server/db/promptTemplates";

import BasicPrompt, { BasicPromptLoading } from "./BasicPrompt";

async function BasicPromptContent() {
  const promptTemplates = await getPromptTemplates();
  return <BasicPrompt promptTemplates={promptTemplates} />;
}

export default function BasicPromptWrapper() {
  return (
    <Suspense fallback={<BasicPromptLoading />}>
      <BasicPromptContent />
    </Suspense>
  );
}
