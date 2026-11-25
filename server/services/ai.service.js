import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { env } from '../config/env.js';
import logger from '../utils/logger.js';

/**
 * One interface for LLM calls: generateText({ system, messages }).
 * Gemini is the primary provider and OpenAI the fallback; whichever has a key
 * is tried in that order. Returns null when no provider is configured or all
 * fail, so callers can fall back to a clearly labelled rule-based answer.
 */

const TIMEOUT_MS = 20_000;
const MAX_OUTPUT_TOKENS = 800;

function withTimeout(promise, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${TIMEOUT_MS / 1000}s`)), TIMEOUT_MS);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

const providers = {
  async gemini({ system, messages }) {
    const { geminiApiKey, geminiModel } = env();
    const model = new GoogleGenerativeAI(geminiApiKey).getGenerativeModel({ model: geminiModel, systemInstruction: system });
    const result = await model.generateContent({
      contents: messages.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
      generationConfig: { temperature: 0.4, maxOutputTokens: MAX_OUTPUT_TOKENS },
    });
    return { text: result.response.text(), model: geminiModel };
  },

  async openai({ system, messages }) {
    const { openaiApiKey, openaiModel } = env();
    const client = new OpenAI({ apiKey: openaiApiKey });
    const completion = await client.chat.completions.create({
      model: openaiModel,
      messages: [{ role: 'system', content: system }, ...messages],
      temperature: 0.4,
      max_completion_tokens: MAX_OUTPUT_TOKENS,
    });
    return { text: completion.choices[0]?.message?.content || '', model: openaiModel };
  },
};

let override = null;
/** Test hook: replace the provider chain with a fake. */
export function setAiOverride(fn) {
  override = fn;
}

export function configuredProviders() {
  const { geminiApiKey, openaiApiKey } = env();
  return [geminiApiKey && 'gemini', openaiApiKey && 'openai'].filter(Boolean);
}

export async function generateText({ system, messages }) {
  if (override) return override({ system, messages });

  for (const name of configuredProviders()) {
    try {
      const { text, model } = await withTimeout(providers[name]({ system, messages }), name);
      if (text?.trim()) return { text: text.trim(), provider: name, model };
      logger.warn(`${name} returned an empty response`);
    } catch (error) {
      logger.warn(`AI provider ${name} failed: ${error.message}`);
    }
  }
  return null;
}
