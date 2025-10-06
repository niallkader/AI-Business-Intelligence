import { Router } from "express";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const router = Router();

// Example route
router.get('/health', (req, res) => {
  res.json({ status: 'API is healthy' });
});

// Test route
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

export default router;