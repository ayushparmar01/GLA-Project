import { config } from '../../config/env.js';
import { IAiProvider, AiGenerateOptions, AiProviderResponse } from './aiProvider.interface.js';
import { GeminiProvider } from './geminiProvider.js';
import { OpenAiProvider } from './openaiProvider.js';
import { DeterministicFallbackProvider } from './deterministicFallbackProvider.js';

interface RateLimitRecord {
  timestamps: number[];
}

export class AiService {
  private static instance: AiService;
  private primaryProvider: IAiProvider;
  private fallbackProvider: DeterministicFallbackProvider;
  private userRateLimits: Map<string, RateLimitRecord> = new Map();

  private constructor() {
    this.fallbackProvider = new DeterministicFallbackProvider();

    // Select provider based on configuration
    const configuredType = (config.aiProvider || 'DETERMINISTIC_FALLBACK').toUpperCase();

    if (configuredType === 'GEMINI' && config.geminiApiKey) {
      this.primaryProvider = new GeminiProvider(
        config.geminiApiKey,
        config.geminiModel,
        config.aiTimeoutMs
      );
    } else if (configuredType === 'OPENAI' && config.openaiApiKey) {
      this.primaryProvider = new OpenAiProvider(
        config.openaiApiKey,
        config.openaiModel,
        config.aiTimeoutMs
      );
    } else {
      this.primaryProvider = this.fallbackProvider;
    }
  }

  public static getInstance(): AiService {
    if (!AiService.instance) {
      AiService.instance = new AiService();
    }
    return AiService.instance;
  }

  /**
   * Overrides the active provider for testing or runtime reconfiguration.
   */
  public setProvider(provider: IAiProvider): void {
    this.primaryProvider = provider;
  }

  public getActiveProviderName(): string {
    return this.primaryProvider.providerName;
  }

  public isRealProviderConnected(): boolean {
    return (
      this.primaryProvider.providerName !== 'DETERMINISTIC_FALLBACK' &&
      this.primaryProvider.isConfigured()
    );
  }

  /**
   * Sanitizes input prompts to defend against prompt injection and enforce length boundaries.
   */
  public sanitizePrompt(input: string, maxLength: number = 2000): string {
    if (!input || typeof input !== 'string') return '';

    let cleaned = input.trim();
    if (cleaned.length > maxLength) {
      cleaned = cleaned.substring(0, maxLength);
    }

    // Neutralize dangerous prompt injection phrases
    const injectionPatterns = [
      /ignore\s+(all\s+)?(previous|prior)\s+instructions/gi,
      /you\s+are\s+now\s+in\s+developer\s+mode/gi,
      /system\s+override/gi,
      /reveal\s+(system\s+)?(prompt|api\s+key|credentials)/gi,
      /act\s+as\s+an\s+unfiltered\s+assistant/gi,
    ];

    for (const pattern of injectionPatterns) {
      cleaned = cleaned.replace(pattern, '[sanitized_instruction]');
    }

    return cleaned;
  }

  /**
   * Checks in-memory sliding window rate limit (per user per minute).
   */
  public checkRateLimit(userId: string): { allowed: boolean; retryAfterSeconds?: number } {
    const maxPerMinute = config.aiRateLimitPerMin || 20;
    const now = Date.now();
    const windowMs = 60 * 1000;

    let record = this.userRateLimits.get(userId);
    if (!record) {
      record = { timestamps: [] };
      this.userRateLimits.set(userId, record);
    }

    // Clean timestamps outside the 1-minute window
    record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

    if (record.timestamps.length >= maxPerMinute) {
      const oldestInWindow = record.timestamps[0];
      const retryAfterSeconds = Math.ceil((windowMs - (now - oldestInWindow)) / 1000);
      return { allowed: false, retryAfterSeconds };
    }

    record.timestamps.push(now);
    return { allowed: true };
  }

  /**
   * Sanitizes logs to strip personally identifiable information (PII).
   */
  private logSafe(message: string, meta?: Record<string, unknown>): void {
    const piiScrubbed = message
      .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '[REDACTED_EMAIL]')
      .replace(/\+?\d{10,14}/g, '[REDACTED_PHONE]');

    if (config.nodeEnv !== 'test') {
      console.log(`[AiService] ${piiScrubbed}`, meta ? JSON.stringify(meta) : '');
    }
  }

  /**
   * Generates text guidance with retry policy and fallback resilience.
   */
  public async generateGuidance(
    userId: string,
    prompt: string,
    options?: AiGenerateOptions
  ): Promise<AiProviderResponse> {
    const rateCheck = this.checkRateLimit(userId);
    if (!rateCheck.allowed) {
      throw new Error(
        `AI rate limit exceeded. Please wait ${rateCheck.retryAfterSeconds} seconds before sending another message.`
      );
    }

    const sanitizedPrompt = this.sanitizePrompt(prompt);
    this.logSafe(`Processing guidance request for user ${userId.substring(0, 8)}...`);

    // If already using deterministic fallback, serve directly
    if (this.primaryProvider.providerName === 'DETERMINISTIC_FALLBACK') {
      return this.fallbackProvider.generateText(sanitizedPrompt, options);
    }

    // Attempt generation with primary provider (with 1 retry for transient failure)
    try {
      return await this.primaryProvider.generateText(sanitizedPrompt, options);
    } catch (primaryError: any) {
      this.logSafe(`Primary provider error: ${primaryError.message}. Retrying once...`);
      try {
        await new Promise((resolve) => setTimeout(resolve, 600)); // Brief backoff
        return await this.primaryProvider.generateText(sanitizedPrompt, options);
      } catch (retryError: any) {
        this.logSafe(`Primary provider failed after retry. Engaging deterministic fallback.`);
        const fallback = await this.fallbackProvider.generateText(sanitizedPrompt, options);
        fallback.fallbackReason = `Primary AI provider (${this.primaryProvider.providerName}) unavailable: ${retryError.message}`;
        return fallback;
      }
    }
  }

  /**
   * Generates structured JSON output with fallback resilience.
   */
  public async generateStructuredData<T>(
    userId: string,
    prompt: string,
    options?: AiGenerateOptions
  ): Promise<{ data: T; isFallback: boolean; provider: string; fallbackReason?: string }> {
    const rateCheck = this.checkRateLimit(userId);
    if (!rateCheck.allowed) {
      throw new Error(
        `AI rate limit exceeded. Please wait ${rateCheck.retryAfterSeconds} seconds before requesting structured generation.`
      );
    }

    const sanitizedPrompt = this.sanitizePrompt(prompt);

    if (this.primaryProvider.providerName === 'DETERMINISTIC_FALLBACK') {
      return this.fallbackProvider.generateStructured<T>(sanitizedPrompt, options);
    }

    try {
      return await this.primaryProvider.generateStructured<T>(sanitizedPrompt, options);
    } catch (primaryError: any) {
      this.logSafe(`Structured primary provider error: ${primaryError.message}. Engaging fallback.`);
      const fallback = await this.fallbackProvider.generateStructured<T>(sanitizedPrompt, options);
      fallback.fallbackReason = `Primary AI provider failed: ${primaryError.message}`;
      return fallback;
    }
  }
}
