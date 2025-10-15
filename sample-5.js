import dotenv from "dotenv";
dotenv.config();
import { ChatOpenAI } from "@langchain/openai";
import { ChatOllama } from "@langchain/ollama";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StateGraph, END } from "@langchain/langgraph";


// use local ollama for testing
const model = new ChatOllama({
  baseUrl: "http://localhost:11434",
  model: "llama3.2",
  temperature: 0.7,
});

/*
const model = new ChatOpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  configuration: {
    baseURL: "https://integrate.api.nvidia.com/v1",
  },
  model: "meta/llama3-70b-instruct",
  //model:"openai/gpt-oss-120b" // much slower than meta/llama3
  //model: "openai/gpt-oss-20b"
});
*/

// Your processed data
const processedData = {
  "salesByRegionAndProduct": "Region,Product,Sales_sum\nSouth,Widget C,78000\nSouth,Widget A,99603\nSouth,Widget D,82500\nSouth,Widget B,88413\nEast,Widget D,71460\nEast,Widget A,89292\nEast,Widget C,71036\nEast,Widget B,88508\nNorth,Widget A,90965\nNorth,Widget C,88701\nNorth,Widget D,90727\nNorth,Widget B,82632\nWest,Widget C,97332\nWest,Widget B,86509\nWest,Widget A,95375\nWest,Widget D,82167\n",
  
  "salesByProductGenderAndAge": "Product,Customer_Gender,Age_Group,Sales_sum\nWidget C,Male,26-35,34423\nWidget C,Female,46-55,35722\nWidget C,Female,26-35,38831\nWidget C,Male,36-45,27800\nWidget C,Male,56-65,32732\nWidget C,Female,<25,23605\nWidget C,Female,36-45,32898\nWidget C,Female,65+,10563\nWidget C,Female,56-65,26280\nWidget C,Male,46-55,27288\nWidget C,Male,<25,31612\nWidget C,Male,65+,13315\nWidget D,Male,26-35,39246\nWidget D,Female,26-35,38060\nWidget D,Female,56-65,39848\nWidget D,Female,36-45,27366\nWidget D,Male,46-55,25037\nWidget D,Male,36-45,32275\nWidget D,Male,56-65,35181\nWidget D,Female,46-55,26860\nWidget D,Female,<25,23218\nWidget D,Male,65+,10675\nWidget D,Male,<25,20043\nWidget D,Female,65+,9045\nWidget A,Female,36-45,42392\nWidget A,Male,65+,14903\nWidget A,Male,56-65,33288\nWidget A,Female,65+,12646\nWidget A,Male,26-35,39907\nWidget A,Male,46-55,29105\nWidget A,Male,36-45,42473\nWidget A,Female,<25,27699\nWidget A,Female,56-65,38750\nWidget A,Male,<25,26214\nWidget A,Female,46-55,33600\nWidget A,Female,26-35,34258\nWidget B,Male,36-45,38093\nWidget B,Female,46-55,32416\nWidget B,Male,56-65,28023\nWidget B,Male,26-35,27036\nWidget B,Female,26-35,32764\nWidget B,Female,56-65,33703\nWidget B,Male,46-55,33757\nWidget B,Male,65+,11775\nWidget B,Female,36-45,31023\nWidget B,Male,<25,26968\nWidget B,Female,<25,30671\nWidget B,Female,65+,19833\n",

  "satisfactionByRegionAndProduct": "Region,Product,Customer_Satisfaction_mean\nSouth,Widget C,2.9091917011381043\nSouth,Widget A,3.1555648687694107\nSouth,Widget D,3.0884582242385656\nSouth,Widget B,2.965622172605445\nEast,Widget D,3.1170243500750274\nEast,Widget A,2.9469378845985235\nEast,Widget C,3.09813110148261\nEast,Widget B,3.123949198754613\nNorth,Widget A,3.0735406629443176\nNorth,Widget C,3.042436671475615\nNorth,Widget D,3.102006560163347\nNorth,Widget B,2.939718341330266\nWest,Widget C,2.9902817027022994\nWest,Widget B,2.9429886320798238\nWest,Widget A,2.9447183323634074\nWest,Widget D,2.9770263364662926\n",
  
  "satisfactionByProductGenderAndAge": "Product,Customer_Gender,Age_Group,Customer_Satisfaction_mean\nWidget C,Male,26-35,2.8969512923485503\nWidget C,Female,46-55,2.731992507818966\nWidget C,Female,26-35,3.177018420198803\nWidget C,Male,36-45,2.9889366887195927\nWidget C,Male,56-65,3.288246777870886\nWidget C,Female,<25,3.057184448331411\nWidget C,Female,36-45,2.986972452311434\nWidget C,Female,65+,3.047670555802766\nWidget C,Female,56-65,3.1052187917328142\nWidget C,Male,46-55,2.8581689219055124\nWidget C,Male,<25,3.022662370100451\nWidget C,Male,65+,3.0476194458918893\nWidget D,Male,26-35,2.8324660011123504\nWidget D,Female,26-35,3.0448653159301364\nWidget D,Female,56-65,3.0455584863828076\nWidget D,Female,36-45,3.2470242295092135\nWidget D,Male,46-55,2.9633154547254055\nWidget D,Male,36-45,2.8847168192760857\nWidget D,Male,56-65,3.271355045874406\nWidget D,Female,46-55,3.4272798581630624\nWidget D,Female,<25,2.925057978895983\nWidget D,Male,65+,3.528610583691968\nWidget D,Male,<25,3.053863048426347\nWidget D,Female,65+,2.78230064327049\nWidget A,Female,36-45,2.9605109858893464\nWidget A,Male,65+,3.2296602341849483\nWidget A,Male,56-65,2.98446842471521\nWidget A,Female,65+,3.018858218712302\nWidget A,Male,26-35,2.902851632819358\nWidget A,Male,46-55,3.0701626446954284\nWidget A,Male,36-45,2.9069659444155382\nWidget A,Female,<25,2.896849919714245\nWidget A,Female,56-65,3.1016737664104364\nWidget A,Male,<25,3.1881817647972963\nWidget A,Female,46-55,3.0660435792306306\nWidget A,Female,26-35,3.2157404129216953\nWidget B,Male,36-45,2.803778414238312\nWidget B,Female,46-55,3.0934164444694017\nWidget B,Male,56-65,2.9814027934712284\nWidget B,Male,26-35,2.9843217795704673\nWidget B,Female,26-35,3.0807226984131155\nWidget B,Female,56-65,3.016385116270373\nWidget B,Male,46-55,2.874364635437428\nWidget B,Male,65+,3.0677945330851264\nWidget B,Female,36-45,3.037631056502443\nWidget B,Male,<25,3.190479346682933\nWidget B,Female,<25,2.8639716851296715\nWidget B,Female,65+,3.1675328810215575\n",
  
  "salesByDayOfWeekAndProduct": "Day,Product,Sales_sum\nSat,Widget C,46304\nSat,Widget A,49646\nSat,Widget D,51865\nSat,Widget B,50144\nSun,Widget D,47329\nSun,Widget C,48785\nSun,Widget A,58786\nSun,Widget B,47475\nMon,Widget A,60462\nMon,Widget B,46099\nMon,Widget D,43648\nMon,Widget C,48788\nTue,Widget C,51591\nTue,Widget D,41631\nTue,Widget A,49778\nTue,Widget B,51460\nWed,Widget C,45367\nWed,Widget D,47420\nWed,Widget B,44622\nWed,Widget A,53163\nThu,Widget D,42731\nThu,Widget C,46938\nThu,Widget B,50473\nThu,Widget A,56713\nFri,Widget A,46687\nFri,Widget C,47296\nFri,Widget B,55789\nFri,Widget D,52230\n",
  
  "avgSalesByProductAndMonthName": "Product,Month_Name,Sales_mean\nWidget C,Jan,567.3090909090909\nWidget C,Feb,542.2444444444444\nWidget C,Mar,509\nWidget C,Apr,587.4230769230769\nWidget C,May,538.0185185185185\nWidget C,Jun,532.6984126984127\nWidget C,Jul,483.5964912280702\nWidget C,Aug,563.8474576271186\nWidget C,Sep,556.0980392156863\nWidget C,Oct,530.5510204081633\nWidget C,Nov,482.6046511627907\nWidget C,Dec,584.2553191489362\nWidget D,Jan,500.2040816326531\nWidget D,Feb,561.1428571428571\nWidget D,Mar,538.6071428571429\nWidget D,Apr,558.7413793103449\nWidget D,May,524.6304347826087\nWidget D,Jun,545.125\nWidget D,Jul,498.96078431372547\nWidget D,Aug,567.1702127659574\nWidget D,Sep,482.43636363636364\nWidget D,Oct,579.4821428571429\nWidget D,Nov,553.6363636363636\nWidget D,Dec,500.58490566037733\nWidget A,Jan,537.1272727272727\nWidget A,Feb,590.0769230769231\nWidget A,Mar,516.031746031746\nWidget A,Apr,558.2857142857143\nWidget A,May,591.2753623188406\nWidget A,Jun,615.4893617021277\nWidget A,Jul,589.5555555555555\nWidget A,Aug,596.0714285714286\nWidget A,Sep,577.5\nWidget A,Oct,561.1692307692308\nWidget A,Nov,577.8333333333334\nWidget A,Dec,565.38\nWidget B,Jan,573.8448275862069\nWidget B,Feb,587.5769230769231\nWidget B,Mar,562.0754716981132\nWidget B,Apr,536.8627450980392\nWidget B,May,617.9583333333334\nWidget B,Jun,524.6346153846154\nWidget B,Jul,611.7272727272727\nWidget B,Aug,562.9090909090909\nWidget B,Sep,517.8571428571429\nWidget B,Oct,521.3617021276596\nWidget B,Nov,610.7551020408164\nWidget B,Dec,557.6666666666666\n"
};


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

const state = new AgentState();


// Agent 1: Pattern Recognition Specialist
async function patternRecognitionAgent(state) {
  console.log("\n🔍 Agent 1: Pattern Recognition Specialist - Starting analysis...");
  
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", `You are a data pattern recognition specialist. Analyze sales data to identify:
1. Overall performance trends and patterns
2. Product performance comparisons
3. Any notable anomalies or outliers

Be specific with numbers and percentages. Format your findings clearly.`],
    ["user", `Analyze this sales data and identify key patterns:

Product Sales by Region:
{salesByRegionAndProduct}

Product Satisfaction by Region
{satisfactionByRegionAndProduct}

Product Sales by Gender and Age:
{salesByProductGenderAndAge}

Product Sales by Week Day:
{salesByDayOfWeekAndProduct}

Average Product Sales by Month:
{avgSalesByProductAndMonthName}

Product Satisfaction by Gender and Age:
{satisfactionByProductGenderAndAge}

Provide a structured analysis with specific insights.`]
  ]);

  const chain = prompt.pipe(model).pipe(new StringOutputParser());
  
  const result = await chain.invoke({
    salesByRegionAndProduct: state.processedData.salesByRegionAndProduct,
    satisfactionByRegionAndProduct: state.processedData.satisfactionByRegionAndProduct,
    salesByProductGenderAndAge: state.processedData.salesByProductGenderAndAge,
    salesByDayOfWeekAndProduct: state.processedData.salesByDayOfWeekAndProduct,
    avgSalesByProductAndMonthName: state.processedData.avgSalesByProductAndMonthName,
    satisfactionByProductGenderAndAge: state.processedData.satisfactionByProductGenderAndAge,
  });

  state.patternFindings = result;
  console.log("✅ Pattern analysis complete");
  return state;
}

// So I can see how long each run takes:
const startTime = new Date();

// TEST AGENT 1
//await patternRecognitionAgent(state);
//console.log("Pattern Findings:\n", state.patternFindings);




// Agent 2: Customer Segmentation Analyst
async function demographicAnalyst(state) {
  console.log("\n👥 Agent 2: Customer Segmentation Analyst - Analyzing demographics...");
  
  /*
  // This version of the prompt incorporates the pattern analysis findings, which may be messing things up a bit
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", `You are a customer segmentation specialist. Using the pattern findings and demographic data:
1. Identify which demographic segments are most valuable
2. Find satisfaction gaps across demographics
3. Determine which groups need attention for specific products
4. Provide actionable demographic insights

Reference the pattern findings to build on existing insights.`
    ],
    ["user", `Previous Pattern Findings:
{patternFindings}

Product Sales by Gender and Age Group:
{salesByProductGenderAndAge}

Product Satisfaction by Gender and Age Group:
{satisfactionByProductGenderAndAge}

Provide demographic insights and recommendations.`]
  ]);
*/

  // In this version of the prompt template I removed any mention of the pattern recognition results
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", `You are a customer segmentation specialist.:
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
    //patternFindings: state.patternFindings,  // I decided to remove this from the prompt template
    salesByProductGenderAndAge: state.processedData.salesByProductGenderAndAge,
    satisfactionByProductGenderAndAge: state.processedData.satisfactionByProductGenderAndAge
  });

  state.demographicInsights = result;
  console.log("✅ Demographic analysis complete");
  return state;
}

// TEST AGENT 2
await demographicAnalyst(state);
console.log("\n\nDemographic Findings:\n", state.demographicInsights);



// Agent 3: Geographic Strategy Advisor
async function geographicAnalyst(state) {
  console.log("\n🌍 Agent 3: Geographic Strategy Advisor - Analyzing regions...");
  
  /*
  // this version of the prompt includes the pattern findings (which seem to muck things up)
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

Product Sales by Region:
{salesByRegionAndProduct}

Product Satisfaction by Region:
{satisfactionByRegionAndProduct}

Provide geographic strategy recommendations.`]
  ]);
  */

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", `You are a geographic strategy advisor. Use the demographic insights, and the product sales and satisfaction data to do the following:
1. Explain regional performance differences
2. Identify region-specific opportunities
3. Recommend product mix adjustments by region
4. Suggest geographic expansion or focus strategies
Build on insights from previous agents.`],
    ["user", `Demographic Insights:
{demographicInsights}

Product Sales by Region:
{salesByRegionAndProduct}

Product Satisfaction by Region:
{satisfactionByRegionAndProduct}

Provide geographic strategy recommendations.`]
  ]);

  const chain = prompt.pipe(model).pipe(new StringOutputParser());
  
  const result = await chain.invoke({
    //patternFindings: state.patternFindings, // I removed this
    demographicInsights: state.demographicInsights,
    salesByRegionAndProduct: state.processedData.salesByRegionAndProduct,
    satisfactionByRegionAndProduct: state.processedData.satisfactionByRegionAndProduct
  });

  state.geographicInsights = result;
  console.log("✅ Geographic analysis complete");
  return state;
}


// TEST AGENT 3
await geographicAnalyst(state);
console.log("\n\nGeographic Findings:\n", state.geographicInsights);







/*
salesByRegionAndProduct
satisfactionByRegionAndProduct
salesByProductGenderAndAge
satisfactionByProductGenderAndAge
salesByDayOfWeekAndProduct
avgSalesByProductAndMonthName
*/ 

// Agent 4: Temporal Analyst
async function temporalAnalyst(state) {
  console.log("\n📅 Agent 4: Temporal Analyst - Analyzing time patterns...");
  
/*
// this prompt includes the pattern findings (which muck things up)
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

Product Sales by Day:
{salesByDayOfWeekAndProduct}

Average Monthly Sales:
{avgSalesByProductAndMonthName}

Analyze temporal patterns and provide insights.`]
  ]);
*/

const prompt = ChatPromptTemplate.fromMessages([
    ["system", `You are a temporal data analyst. Using all previous findings:
1. Identify daily and weekly patterns in sales
2. Spot any concerning trends or anomalies in the time series
3. Provide forecasting insights based on observed patterns
4. Connect temporal patterns to other findings

Consider how time-based insights relate to previous agent findings.`],
    ["user", `Demographic Insights Summary:
{demographicInsights}

Geographic Insights Summary:
{geographicInsights}

Product Sales by Day:
{salesByDayOfWeekAndProduct}

Average Monthly Sales:
{avgSalesByProductAndMonthName}

Analyze temporal patterns and provide insights.`]
  ]);

  const chain = prompt.pipe(model).pipe(new StringOutputParser());
  
  const result = await chain.invoke({
    //patternFindings: state.patternFindings,
    demographicInsights: state.demographicInsights.substring(0, 500) + "...", // Summarize for context
    geographicInsights: state.geographicInsights.substring(0, 500) + "...",
    salesByDayOfWeekAndProduct: state.processedData.salesByDayOfWeekAndProduct,
    avgSalesByProductAndMonthName: state.processedData.salesByDayOfWeekAndProduct,
  });

  state.temporalInsights = result;
  console.log("✅ Temporal analysis complete");
  return state;
}


// TEST AGENT 4
await temporalAnalyst(state);
console.log("\n\nTemporal Findings:\n", state.temporalInsights);



// Agent 5: Strategic Synthesizer
async function strategicSynthesizer(state) {
  console.log("\n📊 Agent 5: Strategic Synthesizer - Creating final report...");
  
  /*
  // this prompt includes the pattern findings
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
  */

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

Create a clear, actionable strategic report.`]
  ]);

  const chain = prompt.pipe(model).pipe(new StringOutputParser());
  
  const result = await chain.invoke({
    //patternFindings: state.patternFindings,
    demographicInsights: state.demographicInsights,
    geographicInsights: state.geographicInsights,
    temporalInsights: state.temporalInsights
  });

  state.finalReport = result;
  console.log("✅ Strategic synthesis complete");
  return state;
}

// TEST AGENT 5
await strategicSynthesizer(state);
console.log("--------------------------------------------");
console.log("\n\nStrategic Findings:\n", state.finalReport);



/*
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

  } catch (error) {
    console.error("❌ Error running workflow:", error);
    throw error;
  }
}

// Run the workflow
main().catch(console.error);
*/

const endTime = new Date();
const runTimeInSeconds = (endTime - startTime)/1000
const runTimeInMinutes = runTimeInSeconds/60
console.log("RUN TIME: " +  runTimeInSeconds + " seconds" + "(" + runTimeInMinutes + " minutes)")