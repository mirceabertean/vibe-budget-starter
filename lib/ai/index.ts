import Anthropic from "@anthropic-ai/sdk";

// Client Claude — folosit în API routes server-side
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});
