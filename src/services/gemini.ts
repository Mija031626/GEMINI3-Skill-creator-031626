import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateSkill(description: string): Promise<string> {
  const systemPrompt = `You are the "Skill Creator" agent. Your job is to take a user's rough intent and turn it into a high-quality SKILL.md file.
A skill includes:
- YAML frontmatter (name, description). 
- The description must be "pushy" (encourage triggering).
- Markdown instructions using the imperative form.
- Progressive disclosure (Metadata -> Body -> References).
- "Anatomy of a Skill" structure.
- Explanations of "Why" things matter (Theory of Mind).

Follow the user's instructions to create a distinctive, production-grade skill.
Avoid generic AI aesthetics.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: `Create a SKILL.md based on this description: ${description}`,
    config: { systemInstruction: systemPrompt },
  });
  return response.text || '';
}

export async function generateUseCases(skillMd: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: `Based on this skill:\n${skillMd}\n\nGenerate 10 comprehensive and realistic use cases where a user would trigger this skill.`,
    config: { systemInstruction: 'You are a QA Analyst.' },
  });
  return response.text || '';
}

export async function executeSkill(model: string, skillMd: string, documentText: string, task: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: model,
    contents: `Document Content:\n${documentText}\n\nTask: ${task}`,
    config: { systemInstruction: `You possess the following skill:\n${skillMd}` },
  });
  return response.text || '';
}

export async function generateFollowUps(result: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: `Based on the result provided:\n${result}\n\nGenerate 20 comprehensive follow-up questions to help the user refine, expand, or audit the work.`,
    config: { systemInstruction: 'You are a strategic consultant.' },
  });
  return response.text || '';
}

export async function extractTextFromPdfLLM(base64Data: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: [
      {
        inlineData: {
          data: base64Data,
          mimeType: 'application/pdf'
        }
      },
      "Extract all text from this document accurately."
    ]
  });
  return response.text || '';
}
