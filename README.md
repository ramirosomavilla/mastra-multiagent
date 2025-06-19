# Next Mastra Multiagent

This repository demonstrates how to run Mastra within a Next.js project, enabling orchestration of multiple intelligent agents with tools and persistent memory in a modern web application environment.

This project is a template for creating and orchestrating multiple intelligent agents using the Mastra framework, integrating tools and persistent memory. It includes examples such as a weather assistant and a file writer agent.

## What does this project do?

- Allows you to define custom agents with instructions, tools, and LLM models.
- Orchestrates collaboration between agents to solve complex tasks.
- Example agents included:
  - **Weather Agent**: Provides weather information.
  - **File Writer Agent**: Writes `.txt` files to the project root.

## Project structure

- `src/mastra/agents/`: Defined agents.
- `src/mastra/tools/`: Tools that agents can use.
- `src/mastra/workflows/`: Workflows that orchestrate agents and tools.
- `src/app/api/`: API endpoints to interact with agents.

---

## How to add a new agent

1. **Create the tool (optional):**
   If your agent needs a custom tool, create it in `src/mastra/tools/`.

   Example:

   ```ts
   // src/mastra/tools/my-new-tool.ts
   import { Tool } from "@mastra/core/tool";
   export const myNewTool = new Tool({
     name: "My New Tool",
     // ...implementation
   });
   ```

2. **Create the agent file:**
   In `src/mastra/agents/`, create a file like `my-new-agent.ts`.

   ```ts
   import { Agent } from "@mastra/core/agent";
   import { myNewTool } from "@/mastra/tools/my-new-tool";
   import { google } from "@ai-sdk/google";

   export const myNewAgent = new Agent({
     name: "My New Agent",
     instructions: `
       Describe here the agent's purpose and behavior.
       Indicate how it should use the tool if applicable.
     `,
     model: google("gemini-1.5-flash"),
     tools: { myNewTool }, // Or omit if it doesn't use tools
   });
   ```

3. **(Optional) Add persistent memory:**
   If your agent needs memory, add the `memory` property using `Memory` and a store, as in `weather-agent.ts`.

4. **Register the agent in the orchestrator and index:**

   - **In `src/mastra/agents/orchestrator-agent.ts`**: Import your agent's tool(s) and add them to the `tools` property if you want the orchestrator to be able to call your agent.
   - **In `src/mastra/tools/orchestrator-tool.ts`**: Create a tool (using `createTool`) that wraps a call to your new agent, following the pattern of the existing tools.

5. **Export the agent:**
   Make sure to export the agent so it can be used in workflows or endpoints.

6. **Integrate the agent in a workflow or endpoint:**
   Use the agent in a workflow (`src/mastra/workflows/`) or expose it via API (`src/app/api/`).

---

## Requirements

- Node.js
- Dependencies in `package.json`

## Installation

```bash
npm install
```

## Running

To run the project, you should start both the Next.js app and the Mastra process:

```bash
npm run dev
npm run mastra:dev
```

---

## Credits

Based on [Mastra.ai](https://mastra.ai/) and [AI SDK](https://sdk.vercel.ai/).
