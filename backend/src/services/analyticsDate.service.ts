import { AnalyticsDateFilter, AnalyticsDatePeriod } from '../types/index.js';

export class AnalyticsDateService {
  /**
   * Resolve start and end Date objects from a date filter preset or custom range
   */
  public static resolveDateRange(filter?: AnalyticsDateFilter): { start: Date; end: Date; period: AnalyticsDatePeriod } {
    const end = new Date();
    const period: AnalyticsDatePeriod = filter?.period || '30D';

    if (period === 'CUSTOM' && filter?.from && filter?.to) {
      const customStart = new Date(filter.from);
      const customEnd = new Date(filter.to);
      if (!isNaN(customStart.getTime()) && !isNaN(customEnd.getTime())) {
        if (customStart <= customEnd) {
          return { start: customStart, end: customEnd, period: 'CUSTOM' };
        }
      }
    }

    let start = new Date();

    switch (period) {
      case 'TODAY':
        start.setHours(0, 0, 0, 0);
        break;

      case '7D':
        start.setDate(end.getDate() - 7);
        break;

      case '30D':
        start.setDate(end.getDate() - 30);
        break;

      case '90D':
        start.setDate(end.getDate() - 90);
        break;

      case 'THIS_MONTH':
        start = new Date(end.getFullYear(), end.getMonth(), 1);
        break;

      case 'PREVIOUS_MONTH':
        start = new Date(end.getFullYear(), end.getMonth() - 1, 1);
        const prevMonthEnd = new Date(end.getFullYear(), end.getMonth(), 0, 23, 59, 59, 999);
        return { start, end: prevMonthEnd, period: 'PREVIOUS_MONTH' };

      case 'THIS_QUARTER': {
        const currentQuarter = Math.floor(end.getMonth() / 3);
        start = new Date(end.getFullYear(), currentQuarter * 3, 1);
        break;
      }

      case 'THIS_YEAR':
        start = new Date(end.getFullYear(), 0, 1);
        break;

      case 'ALL':
      default:
        // Default to beginning of the platform epoch (e.g. 2 years ago)
        start = new Date(2024, 0, 1);
        break;
    }

    return { start, end, period };
  }

  /**
   * Generate timeseries date buckets between start and end dates
   */
  public static generateDateBuckets(start: Date, end: Date, maxBuckets: number = 30): string[] {
    const buckets: string[] = [];
    const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    const stepDays = Math.max(1, Math.ceil(totalDays / maxBuckets));

    const current = new Date(start);
    while (current <= end) {
      buckets.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + stepDays);
    }

    const endStr = end.toISOString().split('T')[0];
    if (!buckets.includes(endStr)) {
      buckets.push(endStr);
    }

    return buckets;
  }
}
