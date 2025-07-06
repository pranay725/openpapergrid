import { streamText } from 'ai';
import { openai, createOpenAI } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { trackUsage } from '@/lib/rate-limiter';

const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  headers: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'X-Title': 'OpenPaper Grid'
  }
});

const AI_PROVIDERS = {
  openai: {
    models: ['gpt-4-turbo-preview', 'gpt-4', 'gpt-3.5-turbo'],
    getModel: (model: string) => openai(model)
  },
  anthropic: {
    models: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
    getModel: (model: string) => anthropic(model)
  },
  openrouter: {
    models: [
      'openrouter/cypher-alpha:free',
      'anthropic/claude-3.5-sonnet',
      'anthropic/claude-3-opus',
      'anthropic/claude-3-sonnet',
      'anthropic/claude-3-haiku',
      'openai/gpt-4-turbo',
      'openai/gpt-4',
      'openai/gpt-3.5-turbo',
      'google/gemini-pro-1.5',
      'meta-llama/llama-3.1-70b-instruct',
      'meta-llama/llama-3.1-8b-instruct',
      'mistralai/mistral-large',
      'deepseek/deepseek-chat'
    ],
    getModel: (model: string) => openrouter(model)
  }
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workId, messages = [], fullText, provider = 'openrouter', model } = body;

    if (!workId || !fullText) {
      return new Response(
        JSON.stringify({ error: 'workId and fullText are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const providerConfig = AI_PROVIDERS[provider as keyof typeof AI_PROVIDERS];
    if (!providerConfig) {
      return new Response(
        JSON.stringify({ error: 'Invalid AI provider' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const selectedModel = model || providerConfig.models[0];
    if (!providerConfig.models.includes(selectedModel)) {
      return new Response(
        JSON.stringify({ error: 'Invalid model for provider' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const systemMessage = {
      role: 'system',
      content: `You are a helpful research assistant answering questions about the following paper. Use the text to provide accurate answers in Markdown.\n\n${fullText.substring(0, 12000)}`
    };

    const chatMessages = [systemMessage, ...messages];

    const result = await streamText({
      model: providerConfig.getModel(selectedModel),
      messages: chatMessages,
      temperature: 0.2,
      maxTokens: 500
    });

    return new Response(result.textStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked'
      }
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ error: 'Chat request failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
