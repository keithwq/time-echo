import { calculateInkCost, generateLifecycleTimestamps, getDaysRemaining } from '@/lib/utils';

describe('Ink Billing Formula', () => {
  test('should calculate correct cost for short text (≤50 chars)', () => {
    expect(calculateInkCost(30)).toBe(1);
    expect(calculateInkCost(50)).toBe(1);
  });

  test('should calculate correct cost for long text (>50 chars)', () => {
    expect(calculateInkCost(51)).toBe(2);
    expect(calculateInkCost(100)).toBe(2);
    expect(calculateInkCost(101)).toBe(3);
    expect(calculateInkCost(150)).toBe(3);
    expect(calculateInkCost(151)).toBe(4);
  });

  test('formula: 1 + ceil(max(0, wordCount - 50) / 50)', () => {
    // Test edge cases
    expect(calculateInkCost(0)).toBe(1);
    expect(calculateInkCost(1)).toBe(1);
    expect(calculateInkCost(200)).toBe(4);
    expect(calculateInkCost(250)).toBe(5);
  });
});

describe('Lifecycle Timestamps (UTC)', () => {
  test('should generate correct lifecycle dates', () => {
    const now = new Date('2024-01-01T00:00:00Z');
    const { active_deadline, protection_end, destruction_date } =
      generateLifecycleTimestamps(now);

    // 99 days
    expect(active_deadline.getUTCDate()).toBe(10);
    expect(active_deadline.getUTCMonth()).toBe(3); // April (0-indexed)

    // 189 days
    expect(protection_end.getUTCDate()).toBe(30);
    expect(protection_end.getUTCMonth()).toBe(6); // July

    // 190 days
    expect(destruction_date.getUTCDate()).toBe(1);
    expect(destruction_date.getUTCMonth()).toBe(7); // August
  });

  test('should store all timestamps in UTC', () => {
    const now = new Date();
    const { active_deadline, protection_end, destruction_date } =
      generateLifecycleTimestamps(now);

    // Verify they are Date objects
    expect(active_deadline instanceof Date).toBe(true);
    expect(protection_end instanceof Date).toBe(true);
    expect(destruction_date instanceof Date).toBe(true);

    // Verify ordering
    expect(active_deadline < protection_end).toBe(true);
    expect(protection_end < destruction_date).toBe(true);
  });
});

describe('Days Remaining Calculation', () => {
  test('should calculate days remaining correctly', () => {
    const now = new Date();
    const futureDate = new Date(now);
    futureDate.setDate(futureDate.getDate() + 10);

    const daysRemaining = getDaysRemaining(futureDate);
    expect(daysRemaining).toBe(10);
  });
});
