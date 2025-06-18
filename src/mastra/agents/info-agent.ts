import { Agent } from "@mastra/core/agent";
import { google } from "@ai-sdk/google";

export const infoAgent = new Agent({
  name: 'Info Agent',
  instructions: `
    You are a helpful assistant that provides information about the user's request.
  `,
  model: google('gemini-1.5-flash'),

});