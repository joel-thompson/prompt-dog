const insertInputIntoPrompt = (template: string, input: string) => {
  return template.replace("{{INPUT}}", input);
};

export default insertInputIntoPrompt;
