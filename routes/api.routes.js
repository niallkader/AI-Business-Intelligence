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

import markdownit from 'markdown-it'
const md = markdownit();

const router = Router();

// Example route
router.get('/health', (req, res) => {
  res.json({ status: 'API is healthy' });
});

// Store clients for each workflow
const clientsMap = {};

// SSE endpoint
router.get("/events/:workflowId", (req, res) => {
  const workflowId = req.params.workflowId;
  
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive"
  });
  res.flushHeaders();

  // Initialize the clients array for this workflowId if it doesn't exist
  if (!clientsMap[workflowId]) {
    clientsMap[workflowId] = []; 
    // setting clientsMap[workflowId] to an array allow you to have multiple sse connections being notified
    // of a single workflow, not really needed right now, but may be useful in the future!
  }
  
  clientsMap[workflowId].push(res);

  req.on("close", () => {
    clientsMap[workflowId] = clientsMap[workflowId].filter(c => c !== res);
    if (clientsMap[workflowId].length === 0) {
      delete clientsMap[workflowId]; // Clean up if no clients are left
    }
    res.end();
  });
});

function sendSSE(workflowId, event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  if (clientsMap[workflowId]) {
    clientsMap[workflowId].forEach(res => res.write(payload));
  }
}

// Wrap agent functions to emit SSE
function wrapAgent(agentFn, stepName, workflowId) {
  return async function(state) {
    const resultState = await agentFn(state);
    sendSSE(workflowId, "progress", { step: stepName, result: resultState });
    return resultState;
  };
}

// Build the workflow graph with wrapped agents
function buildWorkflow(workflowId) {
  const workflow = new StateGraph({
    channels: {
      processedData: null,
      demographicInsights: null,
      geographicInsights: null,
      temporalInsights: null,
      finalReport: null
    }
  });

  workflow.addNode("demographic", wrapAgent(demographicAnalyst, "demographic", workflowId));
  workflow.addNode("geographic", wrapAgent(geographicAnalyst, "geographic", workflowId));
  workflow.addNode("temporal", wrapAgent(temporalAnalyst, "temporal", workflowId));
  workflow.addNode("synthesizer", wrapAgent(strategicSynthesizer, "synthesizer", workflowId));

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

  const workflowId = Date.now(); // Unique ID for this workflow
  const workflow = buildWorkflow(workflowId);
  const initialState = new AgentState();
  initialState.processedData = processedData;

  // Send the workflowId immediately
  res.json({ status: "started", workflowId });

  try {
    // Invoke the workflow asynchronously
    const finalState = await workflow.invoke(initialState);
    sendSSE(workflowId, "done", { finalReport: md.render(finalState.finalReport) });
  } catch (error) {
    sendSSE(workflowId, "error", { error: error.message });
  }
});

export default router;