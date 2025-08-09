class GradedCommit {
  constructor(
    public commitHash: string,
    public violations: { rule: number }[],
    public suggestion: string | undefined,
    public bodySuggestion: string | undefined
  ) {
    this.commitHash = commitHash;
    this.violations = violations;
    this.suggestion = suggestion;
    this.bodySuggestion = bodySuggestion;
  }
  get grade(): number {
    return Math.max(0, 5 - this.violations.length);
  }
}
export { GradedCommit };
