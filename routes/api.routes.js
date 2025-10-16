import dotenv from "dotenv";
dotenv.config();
import { Router } from "express";
import { StateGraph, END } from "@langchain/langgraph";
import { 
  AgentState, 
  demographicAnalyst, 
  geographicAnalyst,
  temporalAnalyst,
  strategicSynthesizer 
} from "../agents.js";

import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const router = Router();

// Example route
router.get('/health', (req, res) => {
  res.json({ status: 'API is healthy' });
});

/*
// Test route
import OpenAI from "openai";

router.post('/test', async (req, res) => {
  const { context } = req.body;
  const systemPrompt = "You are a business intelligence assistant. Analyze the following data and provide insights.";
  try {
    const response = await client.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: context }
      ],
    });
    res.json({ response: response.choices[0].message.content });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
*/

let clients = [];

// SSE endpoint
router.get("/events", (req, res) => {
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive"
  });
  res.flushHeaders();
  clients.push(res);

  req.on("close", () => {
    clients = clients.filter(c => c !== res);
  });
});

function sendSSE(event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  clients.forEach(res => res.write(payload));
}

// Wrap agent functions to emit SSE
function wrapAgent(agentFn, stepName) {
  return async function(state) {
    const resultState = await agentFn(state);
    sendSSE("progress", { step: stepName, result: resultState });
    return resultState;
  };
}

// Build the workflow graph with wrapped agents
function buildWorkflow() {
  const workflow = new StateGraph({
    channels: {
      processedData: null,
      demographicInsights: null,
      geographicInsights: null,
      temporalInsights: null,
      finalReport: null
    }
  });

  workflow.addNode("demographic", wrapAgent(demographicAnalyst, "demographic"));
  workflow.addNode("geographic", wrapAgent(geographicAnalyst, "geographic"));
  workflow.addNode("temporal", wrapAgent(temporalAnalyst, "temporal"));
  workflow.addNode("synthesizer", wrapAgent(strategicSynthesizer, "synthesizer"));

  workflow.addEdge("__start__", "demographic");
  workflow.addEdge("demographic", "geographic");
  workflow.addEdge("geographic", "temporal");
  workflow.addEdge("temporal", "synthesizer");
  workflow.addEdge("synthesizer", END);

  return workflow.compile();
}

// POST endpoint to trigger workflow
router.post("/run-workflow", async (req, res) => {
  const processedData = req.body.processedData;
  if (!processedData) return res.status(400).json({ error: "Missing processedData" });

  const workflow = buildWorkflow();
  const initialState = new AgentState();
  initialState.processedData = processedData;

  try {
    const finalState = await workflow.invoke(initialState);
    sendSSE("done", { finalReport: finalState.finalReport });
    res.json({ status: "started" });
  } catch (error) {
    sendSSE("error", { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

export default router;