export type VerificationDisposition = 'started' | 'joined';

export interface VerificationResult<T> {
  outcome: T;
  disposition: VerificationDisposition;
}

/** Shares one authoritative async verification across every auth entry point. */
export class AuthVerificationCoordinator<T, Source> {
  private inFlight: Promise<T> | null = null;
  private readonly verify: (source: Source) => Promise<T>;

  constructor(verify: (source: Source) => Promise<T>) {
    this.verify = verify;
  }

  request(source: Source): Promise<VerificationResult<T>> {
    if (this.inFlight) {
      return this.inFlight.then((outcome) => ({ outcome, disposition: 'joined' }));
    }

    const running = this.verify(source);
    this.inFlight = running;
    void running.finally(() => {
      if (this.inFlight === running) this.inFlight = null;
    }).catch(() => {});
    return running.then((outcome) => ({ outcome, disposition: 'started' }));
  }
}
