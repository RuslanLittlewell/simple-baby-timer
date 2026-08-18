export class AuthGenerationCoordinator {
  private generation = 0;
  private authenticated = false;
  private handledMissingGeneration: number | null = null;

  snapshot(): number {
    return this.generation;
  }

  isCurrent(generation: number): boolean {
    return generation === this.generation;
  }

  beginLogout(): number {
    this.generation += 1;
    this.authenticated = false;
    this.handledMissingGeneration = null;
    return this.generation;
  }

  observeVerifiedSession(): { generation: number; isNew: boolean } {
    if (this.authenticated) return { generation: this.generation, isNew: false };
    this.generation += 1;
    this.authenticated = true;
    this.handledMissingGeneration = null;
    return { generation: this.generation, isNew: true };
  }

  observeMissingSession(): void {
    this.authenticated = false;
  }

  claimMissingEffects(generation: number): boolean {
    if (!this.isCurrent(generation) || this.handledMissingGeneration === generation) return false;
    this.handledMissingGeneration = generation;
    return true;
  }
}

export const authGeneration = new AuthGenerationCoordinator();

export class LatestAttemptCoordinator {
  private attempt = 0;

  begin(): number {
    this.attempt += 1;
    return this.attempt;
  }

  isCurrent(attempt: number): boolean {
    return attempt === this.attempt;
  }
}
