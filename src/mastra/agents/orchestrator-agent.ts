import { Agent } from "@mastra/core/agent";
import { callWeatherAgent, callFileWriterAgent } from "@/mastra/tools/orchestrator-tool";
import { google } from "@ai-sdk/google";
import { callInfoAgent } from "@/mastra/tools/orchestrator-tool";


export const orchestratorAgent = new Agent({
  name: "orchestrator",
  description: "Orchestrator agent",
  instructions: "You are an orchestrator agent. You are responsible for calling the weather agent to get the weather for a given city.",
  model: google("gemini-1.5-flash"),
  tools: {
    callWeatherAgent,
    callInfoAgent,
    callFileWriterAgent,
  },
});