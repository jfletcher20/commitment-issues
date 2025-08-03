class GradedCommit {
    constructor(
        public commit: string,
        public violations: { rule: number; }[],
        public suggestion: string | undefined,
        public bodySuggestion: string | undefined,
    ) {
        this.commit = commit;
        this.violations = violations;
        this.suggestion = suggestion;
        this.bodySuggestion = bodySuggestion;
    }
}
export { GradedCommit };