export class AuthGenerationCoordinator {
  private generation = 0;
  private verificationEpoch = 0;
  private authenticated = false;
  private explicitLogoutPending = false;
  private handledMissingGeneration: number | null = null;

  snapshot(): number {
    return this.generation;
  }

  isCurrent(generation: number): boolean {
    return generation === this.generation;
  }

  verificationSnapshot(): number {
    return this.verificationEpoch;
  }

  isVerificationCurrent(epoch: number): boolean {
    return epoch === this.verificationEpoch;
  }

  beginLogout(): number {
    this.generation += 1;
    this.verificationEpoch += 1;
    this.authenticated = false;
    this.explicitLogoutPending = true;
    this.handledMissingGeneration = null;
    return this.generation;
  }

  observeVerifiedSession(): { generation: number; verificationEpoch: number; isNew: boolean } {
    const isNew = !this.authenticated;
    this.verificationEpoch += 1;
    if (isNew) this.generation += 1;
    this.authenticated = true;
    this.explicitLogoutPending = false;
    this.handledMissingGeneration = null;
    return { generation: this.generation, verificationEpoch: this.verificationEpoch, isNew };
  }

  observeMissingSession(): void {
    this.authenticated = false;
  }

  isExplicitLogoutPending(): boolean {
    return this.explicitLogoutPending;
  }

  claimMissingEffects(epoch: number): boolean {
    if (!this.isVerificationCurrent(epoch) || this.handledMissingGeneration === epoch) return false;
    this.handledMissingGeneration = epoch;
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
