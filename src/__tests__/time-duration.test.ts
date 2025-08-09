import { describe, it, expect } from 'vitest';
import { TimeDuration } from '../time-duration.js';

describe('TimeDuration', () => {
  describe('static constructors', () => {
    it('should create from seconds', () => {
      const duration = TimeDuration.fromSeconds(1);
      expect(duration.seconds).toBe(1);
      expect(duration.milliseconds).toBe(1000);
      expect(duration.microseconds).toBe(1_000_000);
      expect(duration.nanoseconds).toBe(1_000_000_000);
    });

    it('should create from milliseconds', () => {
      const duration = TimeDuration.fromMilliseconds(1000);
      expect(duration.seconds).toBe(1);
      expect(duration.milliseconds).toBe(1000);
      expect(duration.microseconds).toBe(1_000_000);
      expect(duration.nanoseconds).toBe(1_000_000_000);
    });

    it('should create from microseconds', () => {
      const duration = TimeDuration.fromMicroseconds(1_000_000);
      expect(duration.seconds).toBe(1);
      expect(duration.milliseconds).toBe(1000);
      expect(duration.microseconds).toBe(1_000_000);
      expect(duration.nanoseconds).toBe(1_000_000_000);
    });

    it('should create from nanoseconds', () => {
      const duration = TimeDuration.fromNanoseconds(1_000_000_000);
      expect(duration.seconds).toBe(1);
      expect(duration.milliseconds).toBe(1000);
      expect(duration.microseconds).toBe(1_000_000);
      expect(duration.nanoseconds).toBe(1_000_000_000);
    });

    it('should create from picoseconds', () => {
      const duration = TimeDuration.fromPicoseconds(1_000_000_000_000);
      expect(duration.seconds).toBe(1);
      expect(duration.milliseconds).toBe(1000);
      expect(duration.microseconds).toBe(1_000_000);
      expect(duration.nanoseconds).toBe(1_000_000_000);
      expect(duration.picoseconds).toBe(1_000_000_000_000);
    });

    it('should create from femtoseconds', () => {
      const duration = TimeDuration.fromFemtoseconds(1_000_000_000_000_000);
      expect(duration.seconds).toBe(1);
      expect(duration.milliseconds).toBe(1000);
      expect(duration.microseconds).toBe(1_000_000);
      expect(duration.nanoseconds).toBe(1_000_000_000);
      expect(duration.picoseconds).toBe(1_000_000_000_000);
      expect(duration.femtoseconds).toBe(1_000_000_000_000_000);
    });
  });

  describe('unit conversions', () => {
    it('should convert between all units accurately', () => {
      const duration = TimeDuration.fromMilliseconds(1500); // 1.5 seconds

      expect(duration.seconds).toBe(1.5);
      expect(duration.milliseconds).toBe(1500);
      expect(duration.microseconds).toBe(1_500_000);
      expect(duration.nanoseconds).toBe(1_500_000_000);
      expect(duration.picoseconds).toBe(1_500_000_000_000);
      expect(duration.femtoseconds).toBe(1_500_000_000_000_000);
    });

    it('should handle fractional units', () => {
      const duration = TimeDuration.fromMicroseconds(1.5);
      expect(duration.microseconds).toBe(1.5);
      expect(duration.nanoseconds).toBe(1500);
      expect(duration.picoseconds).toBe(1_500_000);
    });
  });

  describe('arithmetic operations', () => {
    it('should add durations', () => {
      const duration1 = TimeDuration.fromMilliseconds(100);
      const duration2 = TimeDuration.fromMilliseconds(200);
      const result = duration1.add(duration2);

      expect(result.milliseconds).toBe(300);
    });

    it('should subtract durations', () => {
      const duration1 = TimeDuration.fromMilliseconds(300);
      const duration2 = TimeDuration.fromMilliseconds(100);
      const result = duration1.subtract(duration2);

      expect(result.milliseconds).toBe(200);
    });

    it('should multiply by scalar', () => {
      const duration = TimeDuration.fromMilliseconds(100);
      const result = duration.multiply(3);

      expect(result.milliseconds).toBe(300);
    });

    it('should divide by scalar', () => {
      const duration = TimeDuration.fromMilliseconds(300);
      const result = duration.divide(3);

      expect(result.milliseconds).toBe(100);
    });
  });

  describe('comparison operations', () => {
    it('should compare durations', () => {
      const shorter = TimeDuration.fromMilliseconds(100);
      const longer = TimeDuration.fromMilliseconds(200);

      expect(shorter.compare(longer)).toBeLessThan(0);
      expect(longer.compare(shorter)).toBeGreaterThan(0);
      expect(shorter.compare(shorter)).toBe(0);
    });

    it('should check equality', () => {
      const duration1 = TimeDuration.fromMilliseconds(100);
      const duration2 = TimeDuration.fromMilliseconds(100);
      const duration3 = TimeDuration.fromMilliseconds(200);

      expect(duration1.equals(duration2)).toBe(true);
      expect(duration1.equals(duration3)).toBe(false);
    });

    it('should check greater than', () => {
      const shorter = TimeDuration.fromMilliseconds(100);
      const longer = TimeDuration.fromMilliseconds(200);

      expect(longer.isGreaterThan(shorter)).toBe(true);
      expect(shorter.isGreaterThan(longer)).toBe(false);
      expect(shorter.isGreaterThan(shorter)).toBe(false);
    });

    it('should check less than', () => {
      const shorter = TimeDuration.fromMilliseconds(100);
      const longer = TimeDuration.fromMilliseconds(200);

      expect(shorter.isLessThan(longer)).toBe(true);
      expect(longer.isLessThan(shorter)).toBe(false);
      expect(shorter.isLessThan(shorter)).toBe(false);
    });
  });

  describe('string representation', () => {
    it('should format seconds appropriately', () => {
      const duration = TimeDuration.fromSeconds(2.5);
      expect(duration.toString()).toBe('2.500s');
    });

    it('should format milliseconds appropriately', () => {
      const duration = TimeDuration.fromMilliseconds(150.5);
      expect(duration.toString()).toBe('150.500ms');
    });

    it('should format microseconds appropriately', () => {
      const duration = TimeDuration.fromMicroseconds(150.5);
      expect(duration.toString()).toBe('150.500μs');
    });

    it('should format nanoseconds appropriately', () => {
      const duration = TimeDuration.fromNanoseconds(150.5);
      expect(duration.toString()).toBe('150.500ns');
    });

    it('should format picoseconds appropriately', () => {
      const duration = TimeDuration.fromPicoseconds(150.5);
      expect(duration.toString()).toBe('150.500ps');
    });

    it('should format femtoseconds appropriately', () => {
      const duration = TimeDuration.fromFemtoseconds(150.5);
      expect(duration.toString()).toBe('150.500fs');
    });
  });

  describe('edge cases', () => {
    it('should handle zero duration', () => {
      const duration = TimeDuration.fromSeconds(0);
      expect(duration.seconds).toBe(0);
      expect(duration.milliseconds).toBe(0);
      expect(duration.microseconds).toBe(0);
      expect(duration.nanoseconds).toBe(0);
      expect(duration.toString()).toBe('0.000fs');
    });

    it('should handle very small durations', () => {
      const duration = TimeDuration.fromFemtoseconds(1);
      expect(duration.femtoseconds).toBe(1);
      expect(duration.toString()).toBe('1.000fs');
    });

    it('should handle very large durations', () => {
      const duration = TimeDuration.fromSeconds(3600); // 1 hour
      expect(duration.seconds).toBe(3600);
      expect(duration.milliseconds).toBe(3_600_000);
      expect(duration.toString()).toBe('3600.000s');
    });

    it('should handle negative durations', () => {
      const duration = TimeDuration.fromMilliseconds(-100);
      expect(duration.milliseconds).toBe(-100);
      expect(duration.toString()).toBe('-100.000ms');
    });
  });
});
