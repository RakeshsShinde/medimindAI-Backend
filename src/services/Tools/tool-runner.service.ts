import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { AIMessage } from "@langchain/core/messages";
import { StructuredTool } from "@langchain/core/tools";
import { llm } from "../../config/langchain.config";
import { bmiCalculatorTool } from "./bmi.tool";
import { medicineLookupTool } from "./medicine.tool";

export interface ToolRunResult {
    toolResult: { type: string, data: any } | null;
    toolContext: string,
}

const TOOLS: StructuredTool[] = [
    bmiCalculatorTool,
    medicineLookupTool,
];

const TOOL_MAP: Record<string, StructuredTool> = {
    bmi_calculator: bmiCalculatorTool,
    medicine_lookup: medicineLookupTool,
};

export async function runToolAgent(
    userMessage: string,
    chatHistory: { role: string; content: string }[] = [],
    docContext: string = ""
): Promise<ToolRunResult> {
    // Bind all tools to LLM
    const llmwithTools = llm.bindTools(TOOLS);

    // Build multi-turn messages from history so the LLM has context
    // (e.g., weight/height or drug names mentioned in earlier messages)
    const historyMessages = chatHistory.map((msg) =>
        msg.role === "user"
            ? new HumanMessage(msg.content)
            : new AIMessage(msg.content)
    );

    // Routing system prompt — tells the LLM exactly when to call which tool
    const systemMessages: SystemMessage[] = [
        new SystemMessage(
            "You are a routing agent that determines if a medical tool should be called.\n\n" +
            "Available tools:\n" +
            "1. 'bmi_calculator': Call ONLY if BOTH weight AND height are explicitly provided " +
            "in the chat history, current message, or document context. If either is missing, do NOT call it.\n" +
            "2. 'medicine_lookup': Call when the user asks about a SINGLE drug or medication — " +
            "e.g. side effects, dosage, indications, warnings, or contraindications for one drug. " +
            "Pass the drug name as 'drug_name'.\n" +
            "3. 'medicine_interaction': Call when the user asks about interactions or safety " +
            "between 2 or more drugs/medications. Extract ALL drug names mentioned and pass them " +
            "as the 'drug_names' array (minimum 2).\n\n" +
            "If no tool applies (e.g., general health questions, lab result analysis, document review), return no tool call."
        )
    ];

    // If document context is available (uploaded file), prepend it as a
    // system message so the LLM reads actual values from the document
    // before deciding what arguments to pass to the tool.
    if (docContext && docContext !== "No relevant documents found.") {
        systemMessages.push(
            new SystemMessage(
                `The following content was extracted from the user's uploaded document. ` +
                `Use the values in this document (e.g. weight, height, drug names) when calling tools. ` +
                `Do NOT guess or use default values if they are present here.\n\n` +
                `DOCUMENT CONTEXT:\n${docContext}`
            )
        );
    }

    // Invoke LLM with: system messages + history + current message
    const aiMsg = await llmwithTools.invoke([
        ...systemMessages,
        ...historyMessages,
        new HumanMessage(userMessage),
    ]);

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