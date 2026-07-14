import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { AIMessage } from "@langchain/core/messages";
import { StructuredTool } from "@langchain/core/tools";
import { llm } from "../../config/langchain.config";
import { bmiCalculatorTool, BMIData } from "./bmi.tool";

export interface ToolRunResult {
    toolResult: { type: string, data: any } | null;
    toolContext: string,
}

const TOOLS: StructuredTool[] = [
    bmiCalculatorTool,
]

const TOOL_MAP: Record<string, StructuredTool> = {
    bmi_calculator: bmiCalculatorTool,
};

export async function runToolAgent(
    userMessage: string,
    chatHistory: { role: string; content: string }[] = [],
    docContext: string = ""
): Promise<ToolRunResult> {
    // bind tools to LLM
    const llmwithTools = llm.bindTools(TOOLS);

    // Build multi-turn messages from history so the LLM has context
    // (e.g., weight/height mentioned in a previous message)
    const historyMessages = chatHistory.map((msg) =>
        msg.role === "user"
            ? new HumanMessage(msg.content)
            : new AIMessage(msg.content)
    );

    // If document context is available (uploaded file), prepend it as a
    // system message so the LLM reads actual values (weight, height, etc.)
    // from the document before deciding what arguments to pass to the tool.
    const systemMessages: SystemMessage[] = [
        new SystemMessage(
            "You are a routing agent that determines if a medical tool should be called. " +
            "Rule: Only invoke the 'bmi_calculator' tool if BOTH the patient's weight and height are explicitly provided " +
            "in the chat history, current user message, or document context. " +
            "If either weight or height is missing, DO NOT call the 'bmi_calculator' tool under any circumstances."
        )
    ];

    if (docContext && docContext !== "No relevant documents found.") {
        systemMessages.push(
            new SystemMessage(
                `The following content was extracted from the user's uploaded document. ` +
                `Use the values in this document (e.g. weight, height) when calling tools. ` +
                `Do NOT guess or use default values if they are present here.\n\n` +
                `DOCUMENT CONTEXT:\n${docContext}`
            )
        );
    }

    // Invoke with: [system doc context?] + history + current message
    const aiMsg = await llmwithTools.invoke([
        ...systemMessages,
        ...historyMessages,
        new HumanMessage(userMessage),
    ])

    if (!aiMsg.tool_calls || aiMsg.tool_calls.length === 0) {
        return { toolResult: null, toolContext: "" };
    }

    const toolCall = aiMsg.tool_calls[0];
    const tool = TOOL_MAP[toolCall.name];
    if (!tool) {
        return { toolResult: null, toolContext: "" };
    }

    const toolMessage = await tool.invoke(toolCall);
    const rawResult = toolMessage.content as string;

    return {
        toolResult: { type: toolCall.name, data: JSON.parse(rawResult) },
        toolContext: rawResult,
    };

}