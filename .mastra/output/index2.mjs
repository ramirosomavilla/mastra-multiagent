import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { google } from '@ai-sdk/google';
import { Agent } from '@mastra/core/agent';
import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';
import { Memory } from '@mastra/memory';
import { weatherTool } from './tools/0f300d98-a3c2-4e6c-9e0a-7b0bc9eff520.mjs';
import { createTool } from '@mastra/core/tools';
import { promises } from 'fs';

const llm = google("gemini-1.5-flash");
const agent = new Agent({
  name: "Weather Agent",
  model: llm,
  instructions: `
        You are a local activities and travel expert who excels at weather-based planning. Analyze the weather data and provide practical activity recommendations.

        For each day in the forecast, structure your response exactly as follows:

        \u{1F4C5} [Day, Month Date, Year]
        \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550

        \u{1F321}\uFE0F WEATHER SUMMARY
        \u2022 Conditions: [brief description]
        \u2022 Temperature: [X\xB0C/Y\xB0F to A\xB0C/B\xB0F]
        \u2022 Precipitation: [X% chance]

        \u{1F305} MORNING ACTIVITIES
        Outdoor:
        \u2022 [Activity Name] - [Brief description including specific location/route]
          Best timing: [specific time range]
          Note: [relevant weather consideration]

        \u{1F31E} AFTERNOON ACTIVITIES
        Outdoor:
        \u2022 [Activity Name] - [Brief description including specific location/route]
          Best timing: [specific time range]
          Note: [relevant weather consideration]

        \u{1F3E0} INDOOR ALTERNATIVES
        \u2022 [Activity Name] - [Brief description including specific venue]
          Ideal for: [weather condition that would trigger this alternative]

        \u26A0\uFE0F SPECIAL CONSIDERATIONS
        \u2022 [Any relevant weather warnings, UV index, wind conditions, etc.]

        Guidelines:
        - Suggest 2-3 time-specific outdoor activities per day
        - Include 1-2 indoor backup options
        - For precipitation >50%, lead with indoor activities
        - All activities must be specific to the location
        - Include specific venues, trails, or locations
        - Consider activity intensity based on temperature
        - Keep descriptions concise but informative

        Maintain this exact formatting for consistency, using the emoji and section headers as shown.
      `
});
const forecastSchema = z.object({
  date: z.string(),
  maxTemp: z.number(),
  minTemp: z.number(),
  precipitationChance: z.number(),
  condition: z.string(),
  location: z.string()
});
function getWeatherCondition(code) {
  const conditions = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Foggy",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    71: "Slight snow fall",
    73: "Moderate snow fall",
    75: "Heavy snow fall",
    95: "Thunderstorm"
  };
  return conditions[code] || "Unknown";
}
const fetchWeather = createStep({
  id: "fetch-weather",
  description: "Fetches weather forecast for a given city",
  inputSchema: z.object({
    city: z.string().describe("The city to get the weather for")
  }),
  outputSchema: forecastSchema,
  execute: async ({ inputData }) => {
    if (!inputData) {
      throw new Error("Input data not found");
    }
    const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(inputData.city)}&count=1`;
    const geocodingResponse = await fetch(geocodingUrl);
    const geocodingData = await geocodingResponse.json();
    if (!geocodingData.results?.[0]) {
      throw new Error(`Location '${inputData.city}' not found`);
    }
    const { latitude, longitude, name } = geocodingData.results[0];
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=precipitation,weathercode&timezone=auto,&hourly=precipitation_probability,temperature_2m`;
    const response = await fetch(weatherUrl);
    const data = await response.json();
    const forecast = {
      date: (/* @__PURE__ */ new Date()).toISOString(),
      maxTemp: Math.max(...data.hourly.temperature_2m),
      minTemp: Math.min(...data.hourly.temperature_2m),
      condition: getWeatherCondition(data.current.weathercode),
      precipitationChance: data.hourly.precipitation_probability.reduce(
        (acc, curr) => Math.max(acc, curr),
        0
      ),
      location: name
    };
    return forecast;
  }
});
const planActivities = createStep({
  id: "plan-activities",
  description: "Suggests activities based on weather conditions",
  inputSchema: forecastSchema,
  outputSchema: z.object({
    activities: z.string()
  }),
  execute: async ({ inputData }) => {
    const forecast = inputData;
    if (!forecast) {
      throw new Error("Forecast data not found");
    }
    const prompt = `Based on the following weather forecast for ${forecast.location}, suggest appropriate activities:
      ${JSON.stringify(forecast, null, 2)}
      `;
    const response = await agent.stream([
      {
        role: "user",
        content: prompt
      }
    ]);
    let activitiesText = "";
    for await (const chunk of response.textStream) {
      process.stdout.write(chunk);
      activitiesText += chunk;
    }
    return {
      activities: activitiesText
    };
  }
});
const weatherWorkflow = createWorkflow({
  id: "weather-workflow",
  inputSchema: z.object({
    city: z.string().describe("The city to get the weather for")
  }),
  outputSchema: z.object({
    activities: z.string()
  })
}).then(fetchWeather).then(planActivities);
weatherWorkflow.commit();

const weatherAgent = new Agent({
  name: "Weather Agent",
  instructions: `
      You are a helpful weather assistant that provides accurate weather information.

      Your primary function is to help users get weather details for specific locations. When responding:
      - Always ask for a location if none is provided
      - If the location name isn\u2019t in English, please translate it
      - If giving a location with multiple parts (e.g. "New York, NY"), use the most relevant part (e.g. "New York")
      - Include relevant details like humidity, wind conditions, and precipitation
      - Keep responses concise but informative

      Use the weatherTool to fetch current weather data.
`,
  model: google("gemini-1.5-flash"),
  tools: { weatherTool },
  memory: new Memory({
    storage: new LibSQLStore({
      url: "file:../mastra.db"
      // path is relative to the .mastra/output directory
    })
  })
});

const infoAgent = new Agent({
  name: "Info Agent",
  instructions: `
    You are a helpful assistant that provides information about the user's request.
  `,
  model: google("gemini-1.5-flash")
});

const callWeatherAgent = createTool({
  id: "call-weather-agent",
  description: "Call the weather agent",
  inputSchema: z.object({
    city: z.string().describe("City name")
  }),
  execute: async ({ context }) => {
    const agent = mastra.getAgent("weatherAgent");
    const result = await agent.generate([
      {
        role: "user",
        content: `What's the weather like in ${context.city}?`
      }
    ]);
    return { weather: result.text };
  }
});
const callInfoAgent = createTool({
  id: "call-info-agent",
  description: "Call the info agent",
  inputSchema: z.object({
    city: z.string().describe("City name")
  }),
  execute: async ({ context }) => {
    const agent = mastra.getAgent("infoAgent");
    const result = await agent.generate([
      {
        role: "user",
        content: `What's the weather like in ${context.city}?`
      }
    ]);
    return { info: result.text };
  }
});
const callFileWriterAgent = createTool({
  id: "call-file-writer-agent",
  description: "Call the file writer agent to write a file to the project root",
  inputSchema: z.object({
    filename: z.string().describe("Filename"),
    content: z.string().describe("Content")
  }),
  execute: async ({ context }) => {
    const agent = mastra.getAgent("fileWriterAgent");
    const result = await agent.generate([
      {
        role: "user",
        content: `Write a file with the following content: ${context.content} and filename: ${context.filename}`
      }
    ]);
    return { success: true, filePath: result.text };
  }
});

const orchestratorAgent = new Agent({
  name: "orchestrator",
  description: "Orchestrator agent",
  instructions: "You are an orchestrator agent. You are responsible for calling the weather agent to get the weather for a given city.",
  model: google("gemini-1.5-flash"),
  tools: {
    callWeatherAgent,
    callInfoAgent,
    callFileWriterAgent
  }
});

const fileWriterTool = createTool({
  id: "file-writer",
  description: "Writes a .txt file with given filename and content to the project root.",
  inputSchema: z.object({
    filename: z.string().endsWith(".txt").describe("The name of the file to write (must end with .txt)"),
    content: z.string().describe("The content to write into the file")
  }),
  outputSchema: z.object({
    success: z.boolean(),
    filePath: z.string()
  }),
  execute: async ({ context }) => {
    const { filename, content } = context;
    const filePath = `${process.cwd()}/${filename}`;
    await promises.writeFile(filePath, content, "utf8");
    return { success: true, filePath };
  }
});

const fileWriterAgent = new Agent({
  name: "File Writer Agent",
  instructions: `
    You are an agent that writes a .txt file with a given filename and content to the project root.
    Use the fileWriterTool to perform the write operation.
  `,
  model: google("gemini-1.5-flash"),
  tools: { fileWriterTool }
});

const mastra = new Mastra({
  workflows: {
    weatherWorkflow
  },
  agents: {
    weatherAgent,
    infoAgent,
    orchestratorAgent,
    fileWriterAgent
  },
  storage: new LibSQLStore({
    // stores telemetry, evals, ... into memory storage, if it needs to persist, change to file:../mastra.db
    url: ":memory:"
  }),
  logger: new PinoLogger({
    name: "Mastra",
    level: "info"
  })
});

export { callInfoAgent as a, callFileWriterAgent as b, callWeatherAgent as c, mastra as m };
//# sourceMappingURL=index2.mjs.map
