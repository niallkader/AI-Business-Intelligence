import dotenv from "dotenv";
dotenv.config();
import { ChatOpenAI } from "@langchain/openai";

console.log("API KEY", process.env.NVIDIA_API_KEY);

const llm = new ChatOpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  configuration: {
    baseURL: "https://integrate.api.nvidia.com/v1",
  },
  model: "meta/llama3-70b-instruct",
  //model:"openai/gpt-oss-120b" // much slower than meta/llama3
  //model: "openai/gpt-oss-20b"
});

const startTime = new Date();
const response = await llm.invoke("Explain CUDA in simple terms");
const endTime = new Date()
const responseTime = endTime - startTime
console.log("RESPONSE TIME: " + (responseTime/1000) +  " seconds"); 
console.log(response.content);