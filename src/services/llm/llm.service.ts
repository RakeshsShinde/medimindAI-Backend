import { StringOutputParser } from "@langchain/core/output_parsers";
import { llm } from "../../config/langchain.config";
import { chatTitlePromptTemplate } from "../rag/prompt-builder";

export async function generateChatTitle(firstMessage: string): Promise<string> {
  const chain = chatTitlePromptTemplate.pipe(llm).pipe(new StringOutputParser());
  try {
    const title = await chain.invoke({
      firstMessage: firstMessage.substring(0, 500)
    })
    return title ? title.trim().replace(/^["']|["']$/g, "") : "New Chat";
  } catch (err) {
    console.error("Error while generating the chat title ", err);
    return 'New Chat';
  }
}
