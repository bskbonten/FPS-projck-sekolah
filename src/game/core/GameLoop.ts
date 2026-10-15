export class GameLoop {
  private lastTime = 0;
  private animationFrameId: number | null = null;
  private isRunning = false;
  private isPaused = false;
  private onUpdate: (dt: number) => void;
  private onRender: () => void;

  constructor(onUpdate: (dt: number) => void, onRender: () => void) {
    this.onUpdate = onUpdate;
    this.onRender = onRender;
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.animationFrameId = requestAnimationFrame(this.tick.bind(this));
  }

  public stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public setPaused(paused: boolean): void {
    this.isPaused = paused;
    if (!paused) {
      this.lastTime = performance.now();
    }
  }

  private tick(currentTime: number): void {
    if (!this.isRunning) return;

    // Delta time in seconds, clamped to max 0.1s to prevent huge jumps on tab switch/lag
    let dt = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    if (dt > 0.1) {
      dt = 0.1;
    }

    if (!this.isPaused && dt > 0) {
      this.onUpdate(dt);
    }

    this.onRender();

    this.animationFrameId = requestAnimationFrame(this.tick.bind(this));
  }
}
