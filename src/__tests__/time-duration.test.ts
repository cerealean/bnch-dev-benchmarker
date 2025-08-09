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
    describe('automatic unit selection', () => {
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

      it('should choose appropriate unit at boundaries', () => {
        // At the boundary between seconds and milliseconds
        expect(TimeDuration.fromNanoseconds(1_000_000_000).toString()).toBe(
          '1.000s'
        );
        expect(TimeDuration.fromNanoseconds(999_999_999).toString()).toBe(
          '1000.000ms'
        );

        // At the boundary between milliseconds and microseconds
        expect(TimeDuration.fromNanoseconds(1_000_000).toString()).toBe(
          '1.000ms'
        );
        expect(TimeDuration.fromNanoseconds(999_999).toString()).toBe(
          '999.999μs'
        );

        // At the boundary between microseconds and nanoseconds
        expect(TimeDuration.fromNanoseconds(1_000).toString()).toBe('1.000μs');
        expect(TimeDuration.fromNanoseconds(999).toString()).toBe('999.000ns');

        // At the boundary between nanoseconds and picoseconds
        expect(TimeDuration.fromNanoseconds(1).toString()).toBe('1.000ns');
        expect(TimeDuration.fromNanoseconds(0.5).toString()).toBe('500.000ps');

        // At the boundary between picoseconds and femtoseconds
        expect(TimeDuration.fromNanoseconds(0.001).toString()).toBe('1.000ps');
        expect(TimeDuration.fromNanoseconds(0.0005).toString()).toBe(
          '500.000fs'
        );
      });
    });

    describe('manual unit specification', () => {
      it('should respect forced unit selection - seconds', () => {
        const duration = TimeDuration.fromMilliseconds(1500);
        expect(duration.toString({ units: 'seconds' })).toBe('1.500s');
        expect(duration.toString({ units: 'milliseconds' })).toBe('1500.000ms');
        expect(duration.toString({ units: 'microseconds' })).toBe(
          '1500000.000μs'
        );
      });

      it('should respect forced unit selection - milliseconds', () => {
        const duration = TimeDuration.fromMicroseconds(1500);
        expect(duration.toString({ units: 'milliseconds' })).toBe('1.500ms');
        expect(duration.toString({ units: 'microseconds' })).toBe('1500.000μs');
        expect(duration.toString({ units: 'nanoseconds' })).toBe(
          '1500000.000ns'
        );
      });

      it('should respect forced unit selection - microseconds', () => {
        const duration = TimeDuration.fromNanoseconds(1500);
        expect(duration.toString({ units: 'microseconds' })).toBe('1.500μs');
        expect(duration.toString({ units: 'nanoseconds' })).toBe('1500.000ns');
        expect(duration.toString({ units: 'picoseconds' })).toBe(
          '1500000.000ps'
        );
      });

      it('should respect forced unit selection - nanoseconds', () => {
        const duration = TimeDuration.fromPicoseconds(1500);
        expect(duration.toString({ units: 'nanoseconds' })).toBe('1.500ns');
        expect(duration.toString({ units: 'picoseconds' })).toBe('1500.000ps');
        expect(duration.toString({ units: 'femtoseconds' })).toBe(
          '1500000.000fs'
        );
      });

      it('should respect forced unit selection - picoseconds', () => {
        const duration = TimeDuration.fromFemtoseconds(1500000);
        expect(duration.toString({ units: 'picoseconds' })).toBe('1500.000ps');
        expect(duration.toString({ units: 'femtoseconds' })).toBe(
          '1500000.000fs'
        );
      });

      it('should respect forced unit selection - femtoseconds', () => {
        const duration = TimeDuration.fromFemtoseconds(1500);
        expect(duration.toString({ units: 'femtoseconds' })).toBe('1500.000fs');
      });
    });

    describe('custom decimal places', () => {
      it('should support different decimal place counts', () => {
        const duration = TimeDuration.fromMilliseconds(123.456789);

        expect(duration.toString({ decimalPlaces: 0 })).toBe('123ms');
        expect(duration.toString({ decimalPlaces: 1 })).toBe('123.5ms');
        expect(duration.toString({ decimalPlaces: 2 })).toBe('123.46ms');
        expect(duration.toString({ decimalPlaces: 3 })).toBe('123.457ms');
        expect(duration.toString({ decimalPlaces: 6 })).toBe('123.456789ms');
      });

      it('should support custom decimal places with forced units', () => {
        const duration = TimeDuration.fromMilliseconds(1234.5678);

        expect(duration.toString({ units: 'seconds', decimalPlaces: 2 })).toBe(
          '1.23s'
        );
        expect(
          duration.toString({ units: 'microseconds', decimalPlaces: 1 })
        ).toBe('1234567.8μs');
        expect(
          duration.toString({ units: 'nanoseconds', decimalPlaces: 0 })
        ).toBe('1234567800ns');
      });

      it('should handle zero decimal places correctly', () => {
        const duration = TimeDuration.fromMilliseconds(999.999);
        expect(duration.toString({ decimalPlaces: 0 })).toBe('1000ms');
      });
    });

    describe('default behavior', () => {
      it('should use 3 decimal places by default', () => {
        const duration = TimeDuration.fromMilliseconds(123.456789);
        expect(duration.toString()).toBe('123.457ms');
      });

      it('should work with empty options object', () => {
        const duration = TimeDuration.fromMilliseconds(123.456);
        expect(duration.toString({})).toBe('123.456ms');
      });

      it('should work with undefined options', () => {
        const duration = TimeDuration.fromMilliseconds(123.456);
        expect(duration.toString(undefined)).toBe('123.456ms');
      });
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
