/** Monotonic time source in milliseconds; only differences between two readings are meaningful (arbitrary origin); the domain never reads the browser clock (ADR-0002). */
export interface Clock {
  now(): number;
}
