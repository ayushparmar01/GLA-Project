interface RateLimitRecord {
  timestamps: number[];
}

export class WhatsAppRateLimiter {
  private static userLimitMap: Map<string, RateLimitRecord> = new Map();
  private static phoneLimitMap: Map<string, RateLimitRecord> = new Map();

  /**
   * Rate limits link token generation requests (e.g. max 5 requests per 10 minutes per student).
   */
  static isLinkRequestAllowed(userId: string, maxRequests = 5, windowMs = 10 * 60 * 1000): boolean {
    const now = Date.now();
    let record = this.userLimitMap.get(userId);

    if (!record) {
      record = { timestamps: [] };
      this.userLimitMap.set(userId, record);
    }

    record.timestamps = record.timestamps.filter((t) => now - t < windowMs);

    if (record.timestamps.length >= maxRequests) {
      return false;
    }

    record.timestamps.push(now);
    return true;
  }

  /**
   * Rate limits inbound messages per phone number to prevent webhook flooding.
   */
  static isInboundMessageAllowed(phone: string, maxMessages = 30, windowMs = 60 * 1000): boolean {
    const now = Date.now();
    let record = this.phoneLimitMap.get(phone);

    if (!record) {
      record = { timestamps: [] };
      this.phoneLimitMap.set(phone, record);
    }

    record.timestamps = record.timestamps.filter((t) => now - t < windowMs);

    if (record.timestamps.length >= maxMessages) {
      return false;
    }

    record.timestamps.push(now);
    return true;
  }

  /**
   * Clears in-memory maps for test isolation.
   */
  static reset(): void {
    this.userLimitMap.clear();
    this.phoneLimitMap.clear();
  }
}
