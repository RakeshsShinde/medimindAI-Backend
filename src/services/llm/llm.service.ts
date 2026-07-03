import { env } from "../../config/env";
import { groqClient } from "../../config/groq-client";


export async function generateChatTitle(firstMessage: string): Promise<string> {
  const completion = await groqClient.chat.completions.create({
    model: env.GROQ_MODEL!,
    messages: [
      {
        role: "system",
        content: `You are a strict metadata generator. Your sole task is to generate a short, clean title (maximum 4 words) that summarizes the user's initial message.

CRITICAL RULES:
- Output the TITLE ONLY.
- DO NOT answer the user's query or medical questions.
- DO NOT include quotes, prefix text, or punctuation.
- NEVER output conversational text, explanations, or meta-comments.

Examples:
- Message: "analyze my blood report" -> "Blood Report Analysis"
- Message: "what are the side effects of aspirin" -> "Aspirin Side Effects"
- Message: "ECG shows abnormalities" -> "ECG Findings Summary"`,
      },
      {
        role: "user",
        content: firstMessage.substring(0, 500), // Avoid sending huge prompts if file text is present
      },
    ],
    temperature: 0.1,
    max_tokens: 15,
  });

  const title = completion.choices[0]?.message?.content?.trim();

  // Strip any wrapping quotes just in case
  return title ? title.replace(/^["']|["']$/g, "") : "New Chat";
}
