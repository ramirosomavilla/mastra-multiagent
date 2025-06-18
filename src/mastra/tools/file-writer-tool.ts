import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { promises as fs } from 'fs';

export const fileWriterTool = createTool({
  id: 'file-writer',
  description: 'Writes a .txt file with given filename and content to the project root.',
  inputSchema: z.object({
    filename: z.string().endsWith('.txt').describe('The name of the file to write (must end with .txt)'),
    content: z.string().describe('The content to write into the file'),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    filePath: z.string(),
  }),
  execute: async ({ context }) => {
    const { filename, content } = context;
    const filePath = `${process.cwd()}/${filename}`;
    await fs.writeFile(filePath, content, 'utf8');
    return { success: true, filePath };
  },
}); 