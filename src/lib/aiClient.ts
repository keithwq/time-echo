import { OpenAI } from 'openai';

let aiClient: OpenAI | null = null;

export function getAIClient(): any {
  if (!aiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    const baseURL = process.env.OPENAI_BASE_URL;

    console.log('[aiClient] 初始化 AI 客户端');
    console.log('[aiClient] API Key:', apiKey ? `已设置 (长度: ${apiKey.length})` : '❌ 未设置');
    console.log('[aiClient] Base URL:', baseURL || '❌ 未设置');

    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    aiClient = new OpenAI({
      apiKey,
      baseURL: baseURL || undefined,
    });
  }

  return aiClient;
}

export function getModelName(): string {
  return process.env.OPENAI_MODEL || 'gpt-4o-mini';
}
