import dotenv from "dotenv";
dotenv.config();
import { ChatOpenAI } from "@langchain/openai";
import { ChatOllama } from "@langchain/ollama";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StateGraph, END } from "@langchain/langgraph";
//import * as fs from "fs";

// Configuration - Switch between OpenAI and Ollama
const USE_OPENAI = false; // Set to false to use Ollama

const model = USE_OPENAI
  ? new ChatOpenAI({ 
      modelName: "gpt-4o-mini", 
      temperature: 0.7 
    })
  : new ChatOllama({
      baseUrl: "http://localhost:11434",
      model: "llama3.2",
      temperature: 0.7,
    });

// Your processed data
const processedData = {
  regionalSales: [["South",348516],["East",320296],["North",353025],["West",361383]],
  productSalesByRegion: [["South","Widget C",78000],["South","Widget A",99603],["South","Widget D",82500],["South","Widget B",88413],["East","Widget D",71460],["East","Widget A",89292],["East","Widget C",71036],["East","Widget B",88508],["North","Widget A",90965],["North","Widget C",88701],["North","Widget D",90727],["North","Widget B",82632],["West","Widget C",97332],["West","Widget B",86509],["West","Widget A",95375],["West","Widget D",82167]],
  productSatisfaction: [["Widget C",3.007633180811771],["Widget D",3.0703056758699505],["Widget A",3.031918429627926],["Widget B",2.993423630751683]],
  salesByProductAndGender: [["Widget C","Male",167170],["Widget C","Female",167899],["Widget D","Male",162457],["Widget D","Female",164397],["Widget A","Female",189345],["Widget A","Male",185890],["Widget B","Male",165652],["Widget B","Female",180410]],
  satisfactionByProductAndGender: [["Widget C","Male",3.0108272924363852],["Widget C","Female",3.0045603645653123],["Widget D","Male",3.031920687109775],["Widget D","Female",3.108942369474449],["Widget A","Female",3.0512063322142136],["Widget A","Male",3.012864319800256],["Widget B","Male",2.952458618900203],["Widget B","Female",3.033593205479835]],
  satisfactionByProductAndAgeGroup: [["Widget C","26-35",3.0412282976047416],["Widget C","36-50",2.902034463643912],["Widget C","51-65",3.07035597031586],["Widget C","<25",3.038677767217908],["Widget C","65+",3.0476438392584453],["Widget D","26-35",2.935674118875924],["Widget D","51-65",3.145941204395201],["Widget D","36-50",3.1250985733543724],["Widget D","<25",2.984028974584582],["Widget D","65+",3.1554556134812293],["Widget A","36-50",2.9713078307273824],["Widget A","65+",3.1369073473769844],["Widget A","51-65",3.0523707769421002],["Widget A","26-35",3.0452860774928077],["Widget A","<25",3.0425158422557703],["Widget B","36-50",2.967007796777487],["Widget B","51-65",2.947231936915726],["Widget B","26-35",3.0347745969086755],["Widget B","65+",3.1284198033994284],["Widget B","<25",3.008712194890396]],
  salesByDate: [["2022-01-01",786],["2022-01-02",850],["2022-01-03",871],["2022-01-04",464],["2022-01-05",262],["2022-01-06",147],["2022-01-07",610],["2022-01-08",428],["2022-01-09",939],["2022-01-10",215],["2022-01-11",948],["2022-01-12",436],["2022-01-13",980],["2022-01-14",836],["2022-01-15",963],["2022-01-16",939],["2022-01-17",246],["2022-01-18",674],["2022-01-19",905],["2022-01-20",422],["2022-01-21",542],["2022-01-22",936]]
};

// Helper function to format data for LLM
function formatData(dataObj) {
  return Object.entries(dataObj)
    .map(([key, value]) => `${key}:\n${JSON.stringify(value, null, 2)}`)
    .join('\n\n');
}

// Define the state structure
class AgentState {
  constructor() {
    this.processedData = processedData;
    this.patternFindings = "";
    this.demographicInsights = "";
    this.geographicInsights = "";
    this.temporalInsights = "";
    this.finalReport = "";
  }
}

// Agent 1: Pattern Recognition Specialist
async function patternRecognitionAgent(state) {
  console.log("\n🔍 Agent 1: Pattern Recognition Specialist - Starting analysis...");
  
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", `You are a data pattern recognition specialist. Analyze sales data to identify:
1. Overall performance trends and patterns
2. Correlations between satisfaction scores and sales volumes
3. Product performance comparisons
4. Any notable anomalies or outliers

Be specific with numbers and percentages. Format your findings clearly.`],
    ["user", `Analyze this sales data and identify key patterns:

Regional Sales:
{regionalSales}

Product Satisfaction Scores:
{productSatisfaction}

Sales by Product and Gender:
{salesByProductAndGender}

Provide a structured analysis with specific insights.`]
  ]);

  const chain = prompt.pipe(model).pipe(new StringOutputParser());
  
  const result = await chain.invoke({
    regionalSales: JSON.stringify(state.processedData.regionalSales, null, 2),
    productSatisfaction: JSON.stringify(state.processedData.productSatisfaction, null, 2),
    salesByProductAndGender: JSON.stringify(state.processedData.salesByProductAndGender, null, 2)
  });

  state.patternFindings = result;
  console.log("✅ Pattern analysis complete");
  return state;
}

// Agent 2: Customer Segmentation Analyst
async function demographicAnalyst(state) {
  console.log("\n👥 Agent 2: Customer Segmentation Analyst - Analyzing demographics...");
  
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", `You are a customer segmentation specialist. Using the pattern findings and demographic data:
1. Identify which demographic segments are most valuable
2. Find satisfaction gaps across demographics
3. Determine which groups need attention for specific products
4. Provide actionable demographic insights

Reference the pattern findings to build on existing insights.`],
    ["user", `Previous Pattern Findings:
{patternFindings}

Satisfaction by Product and Gender:
{satisfactionByGender}

Satisfaction by Product and Age Group:
{satisfactionByAge}

Sales by Product and Gender:
{salesByGender}

Provide demographic insights and recommendations.`]
  ]);

  const chain = prompt.pipe(model).pipe(new StringOutputParser());
  
  const result = await chain.invoke({
    patternFindings: state.patternFindings,
    satisfactionByGender: JSON.stringify(state.processedData.satisfactionByProductAndGender, null, 2),
    satisfactionByAge: JSON.stringify(state.processedData.satisfactionByProductAndAgeGroup, null, 2),
    salesByGender: JSON.stringify(state.processedData.salesByProductAndGender, null, 2)
  });

  state.demographicInsights = result;
  console.log("✅ Demographic analysis complete");
  return state;
}

// Agent 3: Geographic Strategy Advisor
async function geographicAnalyst(state) {
  console.log("\n🌍 Agent 3: Geographic Strategy Advisor - Analyzing regions...");
  
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", `You are a geographic strategy advisor. Using previous findings:
1. Explain regional performance differences
2. Identify region-specific opportunities
3. Recommend product mix adjustments by region
4. Suggest geographic expansion or focus strategies

Build on insights from previous agents.`],
    ["user", `Pattern Findings:
{patternFindings}

Demographic Insights:
{demographicInsights}

Regional Sales:
{regionalSales}

Product Sales by Region:
{productSalesByRegion}

Provide geographic strategy recommendations.`]
  ]);

  const chain = prompt.pipe(model).pipe(new StringOutputParser());
  
  const result = await chain.invoke({
    patternFindings: state.patternFindings,
    demographicInsights: state.demographicInsights,
    regionalSales: JSON.stringify(state.processedData.regionalSales, null, 2),
    productSalesByRegion: JSON.stringify(state.processedData.productSalesByRegion, null, 2)
  });

  state.geographicInsights = result;
  console.log("✅ Geographic analysis complete");
  return state;
}

// Agent 4: Temporal Analyst
async function temporalAnalyst(state) {
  console.log("\n📅 Agent 4: Temporal Analyst - Analyzing time patterns...");
  
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", `You are a temporal data analyst. Using all previous findings:
1. Identify daily and weekly patterns in sales
2. Spot any concerning trends or anomalies in the time series
3. Provide forecasting insights based on observed patterns
4. Connect temporal patterns to other findings

Consider how time-based insights relate to previous agent findings.`],
    ["user", `Pattern Findings:
{patternFindings}

Demographic Insights Summary:
{demographicInsights}

Geographic Insights Summary:
{geographicInsights}

Sales by Date (Jan 1-22, 2022):
{salesByDate}

Analyze temporal patterns and provide insights.`]
  ]);

  const chain = prompt.pipe(model).pipe(new StringOutputParser());
  
  const result = await chain.invoke({
    patternFindings: state.patternFindings,
    demographicInsights: state.demographicInsights.substring(0, 500) + "...", // Summarize for context
    geographicInsights: state.geographicInsights.substring(0, 500) + "...",
    salesByDate: JSON.stringify(state.processedData.salesByDate, null, 2)
  });

  state.temporalInsights = result;
  console.log("✅ Temporal analysis complete");
  return state;
}

// Agent 5: Strategic Synthesizer
async function strategicSynthesizer(state) {
  console.log("\n📊 Agent 5: Strategic Synthesizer - Creating final report...");
  
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", `You are a strategic business advisor creating an executive summary. Synthesize all findings into:

1. Executive Summary (2-3 sentences of key takeaways)
2. Top 3-5 Strategic Priorities (ranked by impact)
3. Quick Wins (actions that can be implemented immediately)
4. Long-term Initiatives (strategic projects for sustained growth)
5. Key Metrics to Monitor

Be specific, actionable, and prioritize recommendations by potential impact.`],
    ["user", `Synthesize these findings into a comprehensive strategic report:

PATTERN RECOGNITION FINDINGS:
{patternFindings}

DEMOGRAPHIC INSIGHTS:
{demographicInsights}

GEOGRAPHIC INSIGHTS:
{geographicInsights}

TEMPORAL INSIGHTS:
{temporalInsights}

Create a clear, actionable strategic report.`]
  ]);

  const chain = prompt.pipe(model).pipe(new StringOutputParser());
  
  const result = await chain.invoke({
    patternFindings: state.patternFindings,
    demographicInsights: state.demographicInsights,
    geographicInsights: state.geographicInsights,
    temporalInsights: state.temporalInsights
  });

  state.finalReport = result;
  console.log("✅ Strategic synthesis complete");
  return state;
}

// Build the workflow graph
function buildWorkflow() {
  const workflow = new StateGraph({
    channels: {
      processedData: null,
      patternFindings: null,
      demographicInsights: null,
      geographicInsights: null,
      temporalInsights: null,
      finalReport: null
    }
  });

  // Add nodes
  workflow.addNode("patternRecognition", patternRecognitionAgent);
  workflow.addNode("demographic", demographicAnalyst);
  workflow.addNode("geographic", geographicAnalyst);
  workflow.addNode("temporal", temporalAnalyst);
  workflow.addNode("synthesizer", strategicSynthesizer);

  // Define the flow
  workflow.addEdge("__start__", "patternRecognition");
  workflow.addEdge("patternRecognition", "demographic");
  workflow.addEdge("demographic", "geographic");
  workflow.addEdge("geographic", "temporal");
  workflow.addEdge("temporal", "synthesizer");
  workflow.addEdge("synthesizer", END);

  return workflow.compile();
}

// Main execution
async function main() {
  console.log("🚀 Starting Sales Analysis Agentic Workflow");
  console.log(`Using: ${USE_OPENAI ? 'OpenAI' : 'Ollama'}\n`);
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
      model: USE_OPENAI ? 'OpenAI GPT-4' : 'Ollama Llama3.1',
      patternFindings: finalState.patternFindings,
      demographicInsights: finalState.demographicInsights,
      geographicInsights: finalState.geographicInsights,
      temporalInsights: finalState.temporalInsights,
      finalReport: finalState.finalReport
    };

    /*
    // I DON'T WANT TO WRITE ANY FILES IN THE FINISHED VERSION!!!
    fs.writeFileSync(
      'sales_analysis_report.json',
      JSON.stringify(fullReport, null, 2)
    );
    console.log("\n💾 Full report saved to: sales_analysis_report.json");
    */

  } catch (error) {
    console.error("❌ Error running workflow:", error);
    throw error;
  }
}

// Run the workflow
main().catch(console.error);