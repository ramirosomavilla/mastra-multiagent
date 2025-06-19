import { NextRequest, NextResponse } from "next/server";
import { orchestratorAgent } from "@/mastra/agents/orchestrator-agent";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const message = body.message;
  const agent = orchestratorAgent;
  const result = await agent.generate([
    {
      role: 'user',
      content: message,
    },
  ]);

  return NextResponse.json(result.text);
}