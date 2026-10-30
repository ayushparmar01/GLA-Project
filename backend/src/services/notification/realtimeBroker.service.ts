import { Response } from 'express';

export class RealtimeBrokerService {
  private static instance: RealtimeBrokerService;
  // Maps userId -> Set of active HTTP Response streams
  private clientRooms: Map<string, Set<Response>> = new Map();

  private constructor() {}

  public static getInstance(): RealtimeBrokerService {
    if (!RealtimeBrokerService.instance) {
      RealtimeBrokerService.instance = new RealtimeBrokerService();
    }
    return RealtimeBrokerService.instance;
  }

  /**
   * Registers a client connection to their isolated user-specific room.
   */
  public registerClient(userId: string, res: Response): void {
    if (!this.clientRooms.has(userId)) {
      this.clientRooms.set(userId, new Set());
    }

    const userSet = this.clientRooms.get(userId)!;
    userSet.add(res);

    // Initial greeting event
    res.write(`event: connected\ndata: ${JSON.stringify({ userId, connectedAt: new Date().toISOString() })}\n\n`);

    // Clean up when client disconnects
    res.on('close', () => {
      userSet.delete(res);
      if (userSet.size === 0) {
        this.clientRooms.delete(userId);
      }
    });
  }

  /**
   * Sends an event strictly to the designated user's active private connections.
   */
  public sendToUser(userId: string, eventName: string, data: Record<string, unknown>): number {
    const userSet = this.clientRooms.get(userId);
    if (!userSet || userSet.size === 0) {
      return 0;
    }

    const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
    let deliveredCount = 0;

    for (const res of userSet) {
      try {
        res.write(payload);
        deliveredCount++;
      } catch {
        userSet.delete(res);
      }
    }

    return deliveredCount;
  }

  /**
   * Broadcasts to all users belonging to a specific college or role.
   */
  public sendToUsers(userIds: string[], eventName: string, data: Record<string, unknown>): number {
    let count = 0;
    for (const id of userIds) {
      count += this.sendToUser(id, eventName, data);
    }
    return count;
  }

  /**
   * Returns current active connection count for a user (useful for diagnostics & tests).
   */
  public getClientCount(userId: string): number {
    return this.clientRooms.get(userId)?.size || 0;
  }

  /**
   * Returns total active SSE connection count across all rooms.
   */
  public getTotalClientCount(): number {
    let total = 0;
    for (const set of this.clientRooms.values()) {
      total += set.size;
    }
    return total;
  }

  /**
   * Clears all connections (for teardown/testing).
   */
  public reset(): void {
    this.clientRooms.clear();
  }
}
