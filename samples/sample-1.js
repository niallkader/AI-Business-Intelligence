import * as dfd from "danfojs"
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function main() {
  // 1. Load CSV
  const df = await dfd.readCSV("./sales_data.csv");
  df.head().print();

  /*
  // ---- DATA AGGREGATIONS ----

  // Add quarter column
  let dates = df["Date"].values.map(d => new Date(d));
  let quarters = dates.map(d => "Q" + (Math.floor(d.getMonth() / 3) + 1));
  df.addColumn("Quarter", quarters, { inplace: true });

  // Sales by quarter
  const salesByQuarter = df.groupby(["Quarter"]).col(["Sales"]).sum();

  // Sales by region
  const salesByRegion = df.groupby(["Region"]).col(["Sales"]).sum();

  // Avg customer satisfaction by product
  const satisfactionByProduct = df.groupby(["Product"]).col(["Customer_Satisfaction"]).mean();

  // ---- PRINT RESULTS LOCALLY ----
  console.log("\nSales by Quarter:\n");
  salesByQuarter.print();

  console.log("\nSales by Region:\n");
  salesByRegion.print();

  console.log("\nAverage Satisfaction by Product:\n");
  satisfactionByProduct.print();

  // ---- FORMAT RESULTS FOR LLM ----
  const stats = `
  Quarterly Sales: ${JSON.stringify(salesByQuarter.values)}
  Regional Sales: ${JSON.stringify(salesByRegion.values)}
  Product Satisfaction: ${JSON.stringify(satisfactionByProduct.values)}
  `;

  // ---- ASK LLM FOR INSIGHTS ----
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are a business intelligence assistant." },
      {
        role: "user",
        content: `Given this dataset summary: ${stats}.
        1. Identify key trends in sales by quarter and region.
        2. Highlight top- and bottom-performing products in terms of satisfaction.
        3. Suggest 2 business actions.`,
      },
    ],
  });

  console.log("\nAI Insights:\n");
  console.log(response.choices[0].message.content);
  */
}

main().catch(console.error);
