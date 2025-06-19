import { createTool } from "@mastra/core/tools";
import { z } from "zod";

import { Agent } from "@mastra/core/agent";
import { weatherAgent } from "../agents/weather-agent";
import { infoAgent } from "../agents/info-agent";
import { fileWriterAgent } from "../agents/file-writer-agent";

export const callWeatherAgent = createTool({
  id: "call-weather-agent",
  description: weatherAgent.getDescription(),
  inputSchema: z.object({
    city: z.string().describe('City name'),
  }),
  execute: async ({ context }) => {
    const agent: Agent = weatherAgent;
    const result: any = await agent.generate([
      {
        role: 'user',
        content: `What's the weather like in ${context.city}?`,
      },
    ]);
    return { weather: result.text };
  },
});

export const callInfoAgent = createTool({
  id: "call-info-agent",
  description: infoAgent.getDescription(),
  inputSchema: z.object({
    city: z.string().describe('City name'),
  }),
  execute: async ({ context }) => {
    const agent: Agent = infoAgent;
    const result: any = await agent.generate([
      {
        role: 'user',
        content: `What's the weather like in ${context.city}?`,
      },
    ]);
    return { info: result.text };
  },
});

export const callFileWriterAgent = createTool({
  id: "call-file-writer-agent",
  description: fileWriterAgent.getDescription(),
  inputSchema: z.object({
    filename: z.string().describe('Filename'),
    content: z.string().describe('Content'),
  }),
  execute: async ({ context }) => {
    const agent: Agent = fileWriterAgent;
    const result: any = await agent.generate([
      {
        role: 'user',
        content: `Write a file with the following content: ${context.content} and filename: ${context.filename}`,
      },
    ]);
    return { success: true, filePath: result.text };
  },
});