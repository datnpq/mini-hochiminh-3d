export class SimClock {
  private simSec: number; // seconds since 00:00:00 ICT (UTC+7), 0..86400
  private speed = 1;
  private paused = false;
  private lastPerfMs = performance.now();

  constructor() {
    this.simSec = SimClock.getCurrentIctSeconds();
    // If the user opens the app late at night (e.g. 00:00 - 05:00) when Metro is closed,
    // default to a lively daytime/evening hour (08:30) or keep live if between 05:30 and 22:00.
    // Let's keep live time if transit is active, otherwise start at 08:30 ICT so vehicles are immediately visible!
    const hour = this.simSec / 3600;
    if (hour < 5.5 || hour > 22.0) {
      this.simSec = 8.5 * 3600; // 08:30:00 ICT morning rush hour
    }
  }

  static getCurrentIctSeconds(): number {
    const now = new Date();
    const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
    const ict = new Date(utcMs + 7 * 3600 * 1000);
    return (
      ict.getHours() * 3600 +
      ict.getMinutes() * 60 +
      ict.getSeconds() +
      ict.getMilliseconds() / 1000
    );
  }

  tick(nowMs: number): number {
    const dtSec = Math.min(0.25, Math.max(0, (nowMs - this.lastPerfMs) / 1000));
    this.lastPerfMs = nowMs;
    if (!this.paused) {
      this.simSec = (this.simSec + dtSec * this.speed) % 86400;
    }
    return this.simSec;
  }

  getSeconds(): number {
    return this.simSec;
  }

  setSeconds(sec: number): void {
    this.simSec = ((sec % 86400) + 86400) % 86400;
  }

  syncToLive(): void {
    this.simSec = SimClock.getCurrentIctSeconds();
    this.speed = 1;
    this.paused = false;
  }

  getSpeed(): number {
    return this.speed;
  }

  setSpeed(mult: number): void {
    this.speed = mult;
    if (this.paused && mult > 0) this.paused = false;
  }

  isPaused(): boolean {
    return this.paused;
  }

  togglePause(): boolean {
    this.paused = !this.paused;
    return this.paused;
  }

  /** Returns 0 for full night, 1 for full day */
  getDaylightFactor(): number {
    const hour = this.simSec / 3600;
    if (hour >= 6.5 && hour <= 17.5) return 1;
    if (hour < 5.5 || hour > 18.75) return 0;
    if (hour >= 5.5 && hour < 6.5) return (hour - 5.5) / 1.0;
    return Math.max(0, 1 - (hour - 17.5) / 1.25);
  }

  formatTime(): string {
    const total = Math.floor(this.simSec);
    const h = Math.floor(total / 3600) % 24;
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
}
