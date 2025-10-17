import dotenv from "dotenv";
dotenv.config();
import { ChatOpenAI } from "@langchain/openai";
// import { ChatOllama } from "@langchain/ollama";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
// import { StateGraph, END } from "@langchain/langgraph";


/*
// use local ollama for testing
const model = new ChatOllama({
  baseUrl: "http://localhost:11434",
  model: "llama3.2",
  temperature: 0.7,
});
*/


const model = new ChatOpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  configuration: {
    baseURL: "https://integrate.api.nvidia.com/v1",
  },
  model: "meta/llama3-70b-instruct",
  //model:"openai/gpt-oss-120b" // much slower than meta/llama3
  //model: "openai/gpt-oss-20b"
});


/*
const model = new ChatOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  model:"gpt-4"
})
*/


// // Your processed data
// const processedData = {
//   /*The processed data will be posted to the express server*/
// }


// Define the state structure
export class AgentState {
  constructor() {
    this.processedData = {};
    this.demographicInsights = "";
    this.geographicInsights = "";
    this.temporalInsights = "";
    this.finalReport = "";
  }
}

// Agent 1: Customer Segmentation Analyst
export async function demographicAnalyst(state) {
  console.log("\n👥 Agent 1: Customer Segmentation Analyst - Analyzing demographics...");
  // In this version of the prompt template I removed any mention of the pattern recognition results
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", `You are a data analyst and customer segmentation specialist.:
1. Identify which demographic segments are most valuable
2. Find satisfaction gaps across demographics
3. Determine which groups need attention for specific products
4. Provide actionable demographic insights

Reference the pattern findings to build on existing insights.`
    ],
    ["user", `Product Sales by Gender and Age Group:
{salesByProductGenderAndAge}

Product Satisfaction by Gender and Age Group:
{satisfactionByProductGenderAndAge}

Provide demographic insights and recommendations.`]
  ]);

  const chain = prompt.pipe(model).pipe(new StringOutputParser());
  
  const result = await chain.invoke({
    salesByProductGenderAndAge: state.processedData.salesByProductGenderAndAge,
    satisfactionByProductGenderAndAge: state.processedData.satisfactionByProductGenderAndAge
  });

  state.demographicInsights = result;
  console.log("✅ Demographic analysis complete");
  return state;
}


// Agent 2: Geographic Strategy Advisor
export async function geographicAnalyst(state) {
  console.log("\n🌍 Agent 2: Geographic Strategy Advisor - Analyzing regions...");

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", `You are a data analyist and geographic strategy advisor. Use the product sales and satisfaction data to do the following:
1. Explain regional performance differences
2. Identify region-specific opportunities
3. Recommend product mix adjustments by region
4. Suggest geographic expansion or focus strategies
Build on insights from previous agents.`],
    ["user", `Product Sales by Region:
{salesByRegionAndProduct}

Product Satisfaction by Region:
{satisfactionByRegionAndProduct}

Provide geographic strategy recommendations.`]
  ]);

  const chain = prompt.pipe(model).pipe(new StringOutputParser());
  
  const result = await chain.invoke({ 
    salesByRegionAndProduct: state.processedData.salesByRegionAndProduct,
    satisfactionByRegionAndProduct: state.processedData.satisfactionByRegionAndProduct
  });

  state.geographicInsights = result;
  console.log("✅ Geographic analysis complete");
  return state;
}


// Agent 3: Temporal Analyst
export async function temporalAnalyst(state) {
  console.log("\n📅 Agent 3: Temporal Analyst - Analyzing time patterns...");

const prompt = ChatPromptTemplate.fromMessages([
    ["system", `You are a temporal sales data analyst. Use the product and monthly sales data to:
1. Identify daily and weekly patterns in sales
2. Spot any concerning trends or anomalies in the time series
3. Provide forecasting insights based on observed patterns
4. Connect temporal patterns to other findings

Consider how time-based insights relate to previous agent findings.`],
    ["user", `Product Sales by Day:
{salesByDayOfWeekAndProduct}

Average Monthly Sales:
{avgSalesByProductAndMonthName}

Analyze temporal patterns and provide insights.`]
  ]);

  const chain = prompt.pipe(model).pipe(new StringOutputParser());
  
  const result = await chain.invoke({
    // Not sure if I should feed the previous insights into each agent:
    //demographicInsights: state.demographicInsights.substring(0, 500) + "...", // Summarize for context
    //geographicInsights: state.geographicInsights.substring(0, 500) + "...",
    salesByDayOfWeekAndProduct: state.processedData.salesByDayOfWeekAndProduct,
    avgSalesByProductAndMonthName: state.processedData.salesByDayOfWeekAndProduct,
  });

  state.temporalInsights = result;
  console.log("✅ Temporal analysis complete");
  return state;
}


// Agent 4: Strategic Synthesizer
export async function strategicSynthesizer(state) {
  console.log("\n📊 Agent 4: Strategic Synthesizer - Creating final report...");
  
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", `You are a strategic business advisor creating an executive summary. Synthesize all findings into:

1. Executive Summary (2-3 sentences of key takeaways)
2. Top 3-5 Strategic Priorities (ranked by impact)
3. Quick Wins (actions that can be implemented immediately)
4. Long-term Initiatives (strategic projects for sustained growth)
5. Key Metrics to Monitor

Be specific, actionable, and prioritize recommendations by potential impact.`],
    ["user", `Synthesize these findings into a comprehensive strategic report:

DEMOGRAPHIC INSIGHTS:
{demographicInsights}

GEOGRAPHIC INSIGHTS:
{geographicInsights}

TEMPORAL INSIGHTS:
{temporalInsights}

Create a clear, actionable strategic report. Make sure your response is markdown.`]
  ]);

  const chain = prompt.pipe(model).pipe(new StringOutputParser());
  
  const result = await chain.invoke({
    demographicInsights: state.demographicInsights,
    geographicInsights: state.geographicInsights,
    temporalInsights: state.temporalInsights
  });

  state.finalReport = result;
  console.log("✅ Strategic synthesis complete");
  return state;
}


/*
// Build the workflow graph
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

  // Add nodes
  workflow.addNode("demographic", demographicAnalyst);
  workflow.addNode("geographic", geographicAnalyst);
  workflow.addNode("temporal", temporalAnalyst);
  workflow.addNode("synthesizer", strategicSynthesizer);

  // Define the flow
  workflow.addEdge("__start__", "demographic");
  workflow.addEdge("demographic", "geographic");
  workflow.addEdge("geographic", "temporal");
  workflow.addEdge("temporal", "synthesizer");
  workflow.addEdge("synthesizer", END);


  return workflow.compile();
}

// Main execution
async function main() {
  console.log("🚀 Starting Sales Analysis Agentic Workflow");
  console.log("=" .repeat(60));

  const workflow = buildWorkflow();
  const initialState = new AgentState();

  try {
    const finalState = await workflow.invoke(initialState);

    // Display results
    console.log("\n" + "=".repeat(60));
    console.log("📈 FINAL STRATEGIC REPORT");
    console.log("=".repeat(60));
    console.log(finalState.finalReport);

    // Save all outputs to file
    const fullReport = {
      timestamp: new Date().toISOString(),
      demographicInsights: finalState.demographicInsights,
      geographicInsights: finalState.geographicInsights,
      temporalInsights: finalState.temporalInsights,
      finalReport: finalState.finalReport
    };



  } catch (error) {
    console.error("❌ Error running workflow:", error);
    throw error;
  }
}

// Run the workflow
main().catch(console.error);
*/
