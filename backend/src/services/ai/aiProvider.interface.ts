export interface AiGenerateOptions {
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  studentContext?: Record<string, unknown>;
  language?: string;
}

export interface AiProviderResponse {
  content: string;
  isFallback: boolean;
  provider: string;
  fallbackReason?: string;
  tokensUsed?: number;
}

export interface IAiProvider {
  readonly providerName: string;
  isConfigured(): boolean;
  generateText(prompt: string, options?: AiGenerateOptions): Promise<AiProviderResponse>;
  generateStructured<T>(prompt: string, options?: AiGenerateOptions): Promise<{
    data: T;
    isFallback: boolean;
    provider: string;
    fallbackReason?: string;
  }>;
}
