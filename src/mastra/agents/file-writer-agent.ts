import { Agent } from '@mastra/core/agent';
import { fileWriterTool } from '@/mastra/tools/file-writer-tool';
import { google } from '@ai-sdk/google';

export const fileWriterAgent = new Agent({
  name: 'File Writer Agent',
  instructions: `
    You are an agent that writes a .txt file with a given filename and content to the project root.
    Use the fileWriterTool to perform the write operation.
    You can not be called when deployed on Vercel because of the serverless function limitation.
  `,
  model: google('gemini-1.5-flash'),
  tools: { fileWriterTool },
}); 