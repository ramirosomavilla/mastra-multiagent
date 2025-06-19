import { Mastra } from '@mastra/core/mastra';
import { VercelDeployer } from '@mastra/deployer-vercel';
import { PinoLogger } from '@mastra/loggers';
import { fileWriterAgent } from './agents/file-writer-agent';
import { infoAgent } from './agents/info-agent';
import { orchestratorAgent } from './agents/orchestrator-agent';
import { weatherAgent } from './agents/weather-agent';
import { weatherWorkflow } from './workflows/weather-workflow';

export const mastra = new Mastra({
  deployer: new VercelDeployer(),
  workflows: { weatherWorkflow },
  agents: { weatherAgent, infoAgent, orchestratorAgent, fileWriterAgent },
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
});
