// mock data for now

const getPromptTemplates = () => {
  return [
    {
      id: 1,
      name: "Helpful Assistant",
      text: "You are a helpful assistant that can answer questions and help with tasks. Answer the user's question based on the following information:\n\n{{INPUT}}",
    },
    {
      id: 2,
      name: "Proofreader",
      text: "You are an expert proofreader. Review the following text for grammar, spelling, and clarity. Provide suggestions for improvement:\n\n{{INPUT}}",
    },
    {
      id: 3,
      name: "Brainstorming Assistant",
      text: "You are a creative brainstorming assistant. Generate three unique ideas or solutions based on the user's request:\n\n{{INPUT}}",
    },
  ];
};

export default getPromptTemplates;
