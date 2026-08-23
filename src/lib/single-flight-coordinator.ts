export class SingleFlightCoordinator {
  private requestedGeneration = 0;
  private completedGeneration = 0;
  private runner: Promise<void> | null = null;
  private readonly runGeneration: (generation: number) => Promise<void>;

  constructor(runGeneration: (generation: number) => Promise<void>) {
    this.runGeneration = runGeneration;
  }

  request(fresh: boolean, onRequested: (generation: number) => void): Promise<void> {
    if (!this.runner || fresh) {
      const generation = ++this.requestedGeneration;
      onRequested(generation);
    }
    if (!this.runner) this.runner = this.drain();
    return this.runner;
  }

  private async drain(): Promise<void> {
    try {
      while (this.completedGeneration < this.requestedGeneration) {
        
        
        const generation = this.requestedGeneration;
        await this.runGeneration(generation);
        this.completedGeneration = generation;
      }
    } finally {
      this.runner = null;
    }
  }
}
