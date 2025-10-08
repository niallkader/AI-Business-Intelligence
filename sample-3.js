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

const processedData = {
  "dataDescription": [
    ["Metric", "Sales", "Customer_Age", "Customer_Satisfaction"], ["count", 2500, 2500, 2500], ["mean", 553.288, 43.3328, 3.025869359036665], ["std", 260.10175821368546, 14.846757714930847, 1.1569811975628748], ["min", 100, 18, 1.0054220979917954], ["median", 552.5, 43, 3.0494802593187016], ["max", 999, 69, 4.9990062537161775], ["variance", 67652.92462585049, 220.42621464585864, 1.3386054915140237]
  ],
  "regionalSales": [
    ["South", 348516], ["East", 320296], ["North", 353025], ["West", 361383]
  ],
  "productSalesByRegion": [
    ["South", "Widget C", 78000], ["South", "Widget A", 99603], ["South", "Widget D", 82500], ["South", "Widget B", 88413], ["East", "Widget D", 71460], ["East", "Widget A", 89292], ["East", "Widget C", 71036], ["East", "Widget B", 88508], ["North", "Widget A", 90965], ["North", "Widget C", 88701], ["North", "Widget D", 90727], ["North", "Widget B", 82632], ["West", "Widget C", 97332], ["West", "Widget B", 86509], ["West", "Widget A", 95375], ["West", "Widget D", 82167]
  ],
  "productSatisfaction": [
    ["Widget C", 3.007633180811771], ["Widget D", 3.0703056758699505], ["Widget A", 3.031918429627926], ["Widget B", 2.993423630751683]
  ],
  "salesByProductAndGender": [
    ["Widget C", "Male", 167170], ["Widget C", "Female", 167899], ["Widget D", "Male", 162457], ["Widget D", "Female", 164397], ["Widget A", "Female", 189345], ["Widget A", "Male", 185890], ["Widget B", "Male", 165652], ["Widget B", "Female", 180410]
  ],
  "satisfactionByProductAndGender": [
    ["Widget C", "Male", 3.0108272924363852], ["Widget C", "Female", 3.0045603645653123], ["Widget D", "Male", 3.031920687109775], ["Widget D", "Female", 3.108942369474449], ["Widget A", "Female", 3.0512063322142136], ["Widget A", "Male", 3.012864319800256], ["Widget B", "Male", 2.952458618900203], ["Widget B", "Female", 3.033593205479835]
  ],
  "satisfactionByProductAndAgeGroup": [
    ["Widget C", "26-35", 3.0412282976047416], ["Widget C", "36-50", 2.902034463643912], ["Widget C", "51-65", 3.07035597031586], ["Widget C", "<25", 3.038677767217908], ["Widget C", "65+", 3.0476438392584453], ["Widget D", "26-35", 2.935674118875924], ["Widget D", "51-65", 3.145941204395201], ["Widget D", "36-50", 3.1250985733543724], ["Widget D", "<25", 2.984028974584582], ["Widget D", "65+", 3.1554556134812293], ["Widget A", "36-50", 2.9713078307273824], ["Widget A", "65+", 3.1369073473769844], ["Widget A", "51-65", 3.0523707769421002], ["Widget A", "26-35", 3.0452860774928077], ["Widget A", "<25", 3.0425158422557703], ["Widget B", "36-50", 2.967007796777487], ["Widget B", "51-65", 2.947231936915726], ["Widget B", "26-35", 3.0347745969086755], ["Widget B", "65+", 3.1284198033994284], ["Widget B", "<25", 3.008712194890396]], "salesByAge": [["26-35", 284525], ["36-50", 391884], ["51-65", 394026], ["65+", 102755], ["<25", 210030]], "salesByProduct": [["Widget C", 335069], ["Widget D", 326854], ["Widget A", 375235], ["Widget B", 346062]], "salesByProductAndAge": [["Widget C", "26-35", 73254], ["Widget C", "36-50", 93909], ["Widget C", "51-65", 88811], ["Widget C", "<25", 55217], ["Widget C", "65+", 23878], ["Widget D", "26-35", 77306], ["Widget D", "51-65", 102164], ["Widget D", "36-50", 84403], ["Widget D", "<25", 43261], ["Widget D", "65+", 19720], ["Widget A", "36-50", 113537], ["Widget A", "65+", 27549], ["Widget A", "51-65", 106071], ["Widget A", "26-35", 74165], ["Widget A", "<25", 53913], ["Widget B", "36-50", 100035], ["Widget B", "51-65", 96980], ["Widget B", "26-35", 59800], ["Widget B", "65+", 31608], ["Widget B", "<25", 57639]
  ],
  /////////////////////////////////////////These were not includded in the orginal data set
  "salesByProductGenderAndAge": [
    ["Widget C", "Male", "26-35", 34423], ["Widget C", "Female", "36-50", 53266], ["Widget C", "Female", "26-35", 38831], ["Widget C", "Male", "36-50", 40643], ["Widget C", "Male", "51-65", 47177], ["Widget C", "Female", "<25", 23605], ["Widget C", "Female", "65+", 10563], ["Widget C", "Female", "51-65", 41634], ["Widget C", "Male", "<25", 31612], ["Widget C", "Male", "65+", 13315], ["Widget D", "Male", "26-35", 39246], ["Widget D", "Female", "26-35", 38060], ["Widget D", "Female", "51-65", 53257], ["Widget D", "Female", "36-50", 40817], ["Widget D", "Male", "36-50", 43586], ["Widget D", "Male", "51-65", 48907], ["Widget D", "Female", "<25", 23218], ["Widget D", "Male", "65+", 10675], ["Widget D", "Male", "<25", 20043], ["Widget D", "Female", "65+", 9045], ["Widget A", "Female", "36-50", 57941], ["Widget A", "Male", "65+", 14903], ["Widget A", "Male", "51-65", 49270], ["Widget A", "Female", "65+", 12646], ["Widget A", "Male", "26-35", 39907], ["Widget A", "Male", "36-50", 55596], ["Widget A", "Female", "<25", 27699], ["Widget A", "Female", "51-65", 56801], ["Widget A", "Male", "<25", 26214], ["Widget A", "Female", "26-35", 34258], ["Widget B", "Male", "36-50", 53179], ["Widget B", "Female", "51-65", 50286], ["Widget B", "Male", "51-65", 46694], ["Widget B", "Male", "26-35", 27036], ["Widget B", "Female", "26-35", 32764], ["Widget B", "Male", "65+", 11775], ["Widget B", "Female", "36-50", 46856], ["Widget B", "Male", "<25", 26968], ["Widget B", "Female", "<25", 30671], ["Widget B", "Female", "65+", 19833]
  ],
  "salesByMonth": [
    ["Jan 2022", 18470], ["Feb 2022", 15208], ["Mar 2022", 14590], ["Apr 2022", 13376], ["May 2022", 16215], ["Jun 2022", 16218], ["Jul 2022", 18757], ["Aug 2022", 17892], ["Sep 2022", 18070], ["Oct 2022", 15989], ["Nov 2022", 16605], ["Dec 2022", 19267], ["Jan 2023", 16754], ["Feb 2023", 14140], ["Mar 2023", 15192], ["Apr 2023", 17540], ["May 2023", 18168], ["Jun 2023", 16302], ["Jul 2023", 15897], ["Aug 2023", 19093], ["Sep 2023", 16469], ["Oct 2023", 18256], ["Nov 2023", 15413], ["Dec 2023", 19035], ["Jan 2024", 17608], ["Feb 2024", 16443], ["Mar 2024", 16572], ["Apr 2024", 15119], ["May 2024", 19740], ["Jun 2024", 14793], ["Jul 2024", 15524], ["Aug 2024", 17381], ["Sep 2024", 15105], ["Oct 2024", 16521], ["Nov 2024", 15330], ["Dec 2024", 15322], ["Jan 2025", 16032], ["Feb 2025", 20168], ["Mar 2025", 16668], ["Apr 2025", 15395], ["May 2025", 17612], ["Jun 2025", 16909], ["Jul 2025", 16938], ["Aug 2025", 15597], ["Sep 2025", 14842], ["Oct 2025", 18695], ["Nov 2025", 17903], ["Dec 2025", 17147], ["Jan 2026", 17912], ["Feb 2026", 16959], ["Mar 2026", 17685], ["Apr 2026", 19196], ["May 2026", 16381], ["Jun 2026", 18162], ["Jul 2026", 17124], ["Aug 2026", 18352], ["Sep 2026", 13827], ["Oct 2026", 17425], ["Nov 2026", 16831], ["Dec 2026", 16321], ["Jan 2027", 14227], ["Feb 2027", 13717], ["Mar 2027", 16050], ["Apr 2027", 16676], ["May 2027", 17843], ["Jun 2027", 17439], ["Jul 2027", 18234], ["Aug 2027", 16727], ["Sep 2027", 17467], ["Oct 2027", 14049], ["Nov 2027", 17481], ["Dec 2027", 15244], ["Jan 2028", 17534], ["Feb 2028", 16500], ["Mar 2028", 18610], ["Apr 2028", 20387], ["May 2028", 17687], ["Jun 2028", 16112], ["Jul 2028", 16019], ["Aug 2028", 19222], ["Sep 2028", 15835], ["Oct 2028", 18493], ["Nov 2028", 3212]
  ],
  "salesByAgeGroupAndGender": [
    ["26-35", "Male", 140612], ["26-35", "Female", 143913], ["36-50", "Female", 198880], ["36-50", "Male", 193004], ["51-65", "Male", 192048], ["51-65", "Female", 201978], ["65+", "Male", 50668], ["65+", "Female", 52087], ["<25", "Female", 105193], ["<25", "Male", 104837]
  ], 
  "salesByDayOfWeek": [
    ["Sat", 197959], ["Sun", 202375], ["Mon", 198997], ["Tue", 194460], ["Wed", 190572], ["Thu", 196855], ["Fri", 202002]
  ], 
  "salesByDayOfWeekAndProduct": [
    ["Sat", "Widget C", 46304], ["Sat", "Widget A", 49646], ["Sat", "Widget D", 51865], ["Sat", "Widget B", 50144], ["Sun", "Widget D", 47329], ["Sun", "Widget C", 48785], ["Sun", "Widget A", 58786], ["Sun", "Widget B", 47475], ["Mon", "Widget A", 60462], ["Mon", "Widget B", 46099], ["Mon", "Widget D", 43648], ["Mon", "Widget C", 48788], ["Tue", "Widget C", 51591], ["Tue", "Widget D", 41631], ["Tue", "Widget A", 49778], ["Tue", "Widget B", 51460], ["Wed", "Widget C", 45367], ["Wed", "Widget D", 47420], ["Wed", "Widget B", 44622], ["Wed", "Widget A", 53163], ["Thu", "Widget D", 42731], ["Thu", "Widget C", 46938], ["Thu", "Widget B", 50473], ["Thu", "Widget A", 56713], ["Fri", "Widget A", 46687], ["Fri", "Widget C", 47296], ["Fri", "Widget B", 55789], ["Fri", "Widget D", 52230]
  ]
}

/*
salesByProductGenderAndAge
salesByMonth
salesByAgeGroupAndGender
salesByDayOfWeek
salesByDayOfWeekAndProduct

REMOVE salesByDate
*/

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
3. Correlations between demographics (age, gender) and sales
4. Correlations between time (months, days) and sales performance
5. Product performance comparisons
6. Any notable anomalies or outliers

Be specific with numbers and percentages. Format your findings clearly.`],
    ["user", `Analyze this sales data and identify key patterns:

Sales by Day of Week and Product:
{salesByDayOfWeekAndProduct}

Product Satisfaction Scores:
{productSatisfaction}

Sales by Product, Gender, and Age:
{salesByProductGenderAndAge}

Provide a structured analysis with specific insights.`]
  ]);

  const chain = prompt.pipe(model).pipe(new StringOutputParser());
  
  const result = await chain.invoke({
    //regionalSales: JSON.stringify(state.processedData.regionalSales, null, 2),
    salesByDayOfWeekAndProduct: JSON.stringify(state.processedData.salesByDayOfWeekAndProduct, null, 2),
    productSatisfaction: JSON.stringify(state.processedData.productSatisfaction, null, 2),
    //salesByProductAndGender: JSON.stringify(state.processedData.salesByProductAndGender, null, 2) // removed this, it's already covered
    salesByProductGenderAndAge: JSON.stringify(state.processedData.salesByProductGenderAndAge, null, 2)
  });

  state.patternFindings = result;
  console.log("✅ Pattern analysis complete");
  return state;
}

patternRecognitionAgent({processedData}).then((state) => {
  console.log("Pattern Findings:\n", state.patternFindings);
}).catch((error) => {
  console.error("Error in Pattern Recognition Agent:", error);
});