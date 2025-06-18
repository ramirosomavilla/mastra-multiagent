import { NextRequest, NextResponse } from "next/server";
import { mastra } from "../../../mastra";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const message = body.message;
  const agent = mastra.getAgent('orchestratorAgent');
  const result = await agent.generate([
    {
      role: 'user',
      content: message,
    },
  ]);

  return NextResponse.json(result.text);
}