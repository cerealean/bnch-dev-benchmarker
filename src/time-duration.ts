interface TimeDurationToStringOptions {
  units?:
    | 'seconds'
    | 'milliseconds'
    | 'microseconds'
    | 'nanoseconds'
    | 'picoseconds'
    | 'femtoseconds';
  decimalPlaces?: number;
}

/**
 * A class for representing time durations with multiple unit conversions
 */
export class TimeDuration {
  private readonly _nanoseconds: number;

  /**
   * Create a TimeDuration from nanoseconds (the base unit)
   */
  private constructor(nanoseconds: number) {
    this._nanoseconds = nanoseconds;
  }

  /**
   * Create a TimeDuration from seconds
   */
  static fromSeconds(seconds: number): TimeDuration {
    return new TimeDuration(seconds * 1_000_000_000);
  }

  /**
   * Create a TimeDuration from milliseconds
   */
  static fromMilliseconds(milliseconds: number): TimeDuration {
    return new TimeDuration(milliseconds * 1_000_000);
  }

  /**
   * Create a TimeDuration from microseconds
   */
  static fromMicroseconds(microseconds: number): TimeDuration {
    return new TimeDuration(microseconds * 1_000);
  }

  /**
   * Create a TimeDuration from nanoseconds
   */
  static fromNanoseconds(nanoseconds: number): TimeDuration {
    return new TimeDuration(nanoseconds);
  }

  /**
   * Create a TimeDuration from picoseconds
   */
  static fromPicoseconds(picoseconds: number): TimeDuration {
    return new TimeDuration(picoseconds / 1_000);
  }

  /**
   * Create a TimeDuration from femtoseconds
   */
  static fromFemtoseconds(femtoseconds: number): TimeDuration {
    return new TimeDuration(femtoseconds / 1_000_000);
  }

  /**
   * Get the duration in seconds
   */
  get seconds(): number {
    return this._nanoseconds / 1_000_000_000;
  }

  /**
   * Get the duration in milliseconds
   */
  get milliseconds(): number {
    return this._nanoseconds / 1_000_000;
  }

  /**
   * Get the duration in microseconds
   */
  get microseconds(): number {
    return this._nanoseconds / 1_000;
  }

  /**
   * Get the duration in nanoseconds
   */
  get nanoseconds(): number {
    return this._nanoseconds;
  }

  /**
   * Get the duration in picoseconds
   */
  get picoseconds(): number {
    return this._nanoseconds * 1_000;
  }

  /**
   * Get the duration in femtoseconds
   */
  get femtoseconds(): number {
    return this._nanoseconds * 1_000_000;
  }

  /**
   * Add another TimeDuration to this one
   */
  add(other: TimeDuration): TimeDuration {
    return new TimeDuration(this._nanoseconds + other._nanoseconds);
  }

  /**
   * Subtract another TimeDuration from this one
   */
  subtract(other: TimeDuration): TimeDuration {
    return new TimeDuration(this._nanoseconds - other._nanoseconds);
  }

  /**
   * Multiply this TimeDuration by a scalar
   */
  multiply(scalar: number): TimeDuration {
    return new TimeDuration(this._nanoseconds * scalar);
  }

  /**
   * Divide this TimeDuration by a scalar
   */
  divide(scalar: number): TimeDuration {
    return new TimeDuration(this._nanoseconds / scalar);
  }

  /**
   * Compare this TimeDuration with another
   */
  compare(other: TimeDuration): number {
    return this._nanoseconds - other._nanoseconds;
  }

  /**
   * Check if this TimeDuration equals another
   */
  equals(other: TimeDuration): boolean {
    return this._nanoseconds === other._nanoseconds;
  }

  /**
   * Check if this TimeDuration is greater than another
   */
  isGreaterThan(other: TimeDuration): boolean {
    return this._nanoseconds > other._nanoseconds;
  }

  /**
   * Check if this TimeDuration is less than another
   */
  isLessThan(other: TimeDuration): boolean {
    return this._nanoseconds < other._nanoseconds;
  }

  /**
   * Convert to a human-readable string with the most appropriate unit
   */

  toString(
    options: TimeDurationToStringOptions = { decimalPlaces: 3 }
  ): string {
    if (options.units) {
      switch (options.units) {
        case 'seconds':
          return `${this.seconds.toFixed(options.decimalPlaces)}s`;
        case 'milliseconds':
          return `${this.milliseconds.toFixed(options.decimalPlaces)}ms`;
        case 'microseconds':
          return `${this.microseconds.toFixed(options.decimalPlaces)}μs`;
        case 'nanoseconds':
          return `${this.nanoseconds.toFixed(options.decimalPlaces)}ns`;
        case 'picoseconds':
          return `${this.picoseconds.toFixed(options.decimalPlaces)}ps`;
        case 'femtoseconds':
          return `${this.femtoseconds.toFixed(options.decimalPlaces)}fs`;
      }
    }

    const relevantUnit = this.getRelevantUnitAbbr();
    switch (relevantUnit) {
      case 's':
        return `${this.seconds.toFixed(options.decimalPlaces)}${relevantUnit}`;
      case 'ms':
        return `${this.milliseconds.toFixed(
          options.decimalPlaces
        )}${relevantUnit}`;
      case 'μs':
        return `${this.microseconds.toFixed(
          options.decimalPlaces
        )}${relevantUnit}`;
      case 'ns':
        return `${this.nanoseconds.toFixed(
          options.decimalPlaces
        )}${relevantUnit}`;
      case 'ps':
        return `${this.picoseconds.toFixed(
          options.decimalPlaces
        )}${relevantUnit}`;
      default:
        return `${this.femtoseconds.toFixed(
          options.decimalPlaces
        )}${relevantUnit}`;
    }
  }

  private getRelevantUnitAbbr() {
    const abs = Math.abs(this._nanoseconds);
    if (abs >= 1_000_000_000) return 's';
    if (abs >= 1_000_000) return 'ms';
    if (abs >= 1_000) return 'μs';
    if (abs >= 1) return 'ns';
    if (abs >= 0.001) return 'ps';
    return 'fs';
  }
}
