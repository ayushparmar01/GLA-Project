export interface ParsedWhatsAppMessage {
  messageId: string;
  from: string; // E.164 phone number
  timestamp: Date;
  type: 'text' | 'interactive' | 'button' | 'other';
  rawText?: string;
  command?: string;
  selectedId?: string;
}

export interface ParsedWhatsAppStatus {
  messageId: string;
  recipientId: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: Date;
  error?: string;
}

export class WhatsAppMessageParser {
  /**
   * Parses the complex nested Meta WhatsApp Business Webhook JSON structure.
   */
  static parseWebhookBody(body: any): {
    messages: ParsedWhatsAppMessage[];
    statuses: ParsedWhatsAppStatus[];
  } {
    const messages: ParsedWhatsAppMessage[] = [];
    const statuses: ParsedWhatsAppStatus[] = [];

    if (!body || body.object !== 'whatsapp_business_account' || !Array.isArray(body.entry)) {
      return { messages, statuses };
    }

    for (const entry of body.entry) {
      if (!Array.isArray(entry.changes)) continue;

      for (const change of entry.changes) {
        if (change.field !== 'messages' || !change.value) continue;

        const val = change.value;

        // 1. Process inbound messages
        if (Array.isArray(val.messages)) {
          for (const msg of val.messages) {
            const parsed = this.parseSingleMessage(msg);
            if (parsed) messages.push(parsed);
          }
        }

        // 2. Process message delivery statuses
        if (Array.isArray(val.statuses)) {
          for (const st of val.statuses) {
            const parsedStatus = this.parseSingleStatus(st);
            if (parsedStatus) statuses.push(parsedStatus);
          }
        }
      }
    }

    return { messages, statuses };
  }

  private static parseSingleMessage(msg: any): ParsedWhatsAppMessage | null {
    if (!msg || !msg.id || !msg.from) return null;

    const from = msg.from.replace(/[^0-9]/g, '');
    const timestamp = msg.timestamp ? new Date(parseInt(msg.timestamp, 10) * 1000) : new Date();

    let rawText: string | undefined;
    let selectedId: string | undefined;
    let type: 'text' | 'interactive' | 'button' | 'other' = 'other';

    if (msg.type === 'text' && msg.text?.body) {
      type = 'text';
      rawText = msg.text.body.trim();
    } else if (msg.type === 'interactive') {
      type = 'interactive';
      if (msg.interactive?.type === 'button_reply') {
        rawText = msg.interactive.button_reply.title;
        selectedId = msg.interactive.button_reply.id;
      } else if (msg.interactive?.type === 'list_reply') {
        rawText = msg.interactive.list_reply.title;
        selectedId = msg.interactive.list_reply.id;
      }
    } else if (msg.type === 'button') {
      type = 'button';
      rawText = msg.button?.text;
      selectedId = msg.button?.payload;
    }

    const command = this.normalizeCommand(rawText || selectedId || '');

    return {
      messageId: msg.id,
      from,
      timestamp,
      type,
      rawText,
      command,
      selectedId,
    };
  }

  private static parseSingleStatus(st: any): ParsedWhatsAppStatus | null {
    if (!st || !st.id || !st.recipient_id) return null;

    return {
      messageId: st.id,
      recipientId: st.recipient_id,
      status: st.status || 'sent',
      timestamp: st.timestamp ? new Date(parseInt(st.timestamp, 10) * 1000) : new Date(),
      error: st.errors?.[0]?.message,
    };
  }

  /**
   * Normalizes numeric shortcuts, button IDs, and text variants into standard commands.
   */
  public static normalizeCommand(input: string): string {
    if (!input) return 'UNKNOWN';

    const trimmed = input.trim().toUpperCase();

    // Numeric menu choices
    if (trimmed === '1' || trimmed.includes('FIND JOBS') || trimmed === 'JOBS' || trimmed === 'CMD_JOBS') {
      return 'JOBS';
    }
    if (trimmed === '2' || trimmed.includes('MY APPLICATIONS') || trimmed === 'APPLICATIONS' || trimmed === 'CMD_APPLICATIONS') {
      return 'APPLICATIONS';
    }
    if (trimmed === '3' || trimmed.includes('INTERVIEW UPDATES') || trimmed === 'INTERVIEWS' || trimmed === 'CMD_INTERVIEWS') {
      return 'INTERVIEWS';
    }
    if (trimmed === '4' || trimmed.includes('MY PROFILE') || trimmed === 'PROFILE' || trimmed === 'CMD_PROFILE') {
      return 'PROFILE';
    }
    if (trimmed === '5' || trimmed.includes('SKILL DEVELOPMENT') || trimmed === 'SKILLS' || trimmed === 'CMD_SKILLS') {
      return 'SKILLS';
    }
    if (trimmed === '6' || trimmed.includes('AI CAREER GUIDANCE') || trimmed === 'GUIDANCE' || trimmed === 'CMD_GUIDANCE') {
      return 'GUIDANCE';
    }
    if (trimmed === '7' || trimmed.includes('HELP & SUPPORT') || trimmed === 'HELP' || trimmed === 'CMD_HELP') {
      return 'HELP';
    }

    // Explicit system commands
    if (trimmed === 'MENU' || trimmed === 'HOME' || trimmed === 'START_MENU') {
      return 'MENU';
    }
    if (trimmed === 'STOP' || trimmed === 'UNSUBSCRIBE' || trimmed === 'OPT_OUT') {
      return 'STOP';
    }
    if (trimmed === 'START' || trimmed === 'SUBSCRIBE' || trimmed === 'OPT_IN') {
      return 'START';
    }

    // Check if input looks like a 6-character linking code (e.g. "CB-1234" or "A1B2C3")
    const cleanAlphaNum = trimmed.replace(/[^A-Z0-9]/g, '');
    if (cleanAlphaNum.length === 6) {
      return `LINK_${cleanAlphaNum}`;
    }

    return 'TEXT_QUERY';
  }
}
