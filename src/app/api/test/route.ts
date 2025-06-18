import { NextRequest, NextResponse } from 'next/server';
import { mastra } from '../../../mastra';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const city = body.city;
  const agent = mastra.getAgent('weatherAgent');
  const result = await agent.generate(`What's the weather like in ${city}?`);
  return NextResponse.json(result.text);
}
