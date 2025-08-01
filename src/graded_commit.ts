import { Commit } from "./commit";

class GradedCommit {
    constructor(
        public commit: string,
        public violations: { rule: number; }[],
        public suggestion: string | undefined
    ) {
        this.commit = commit;
        this.violations = violations;
        this.suggestion = suggestion;
    }
}
export { GradedCommit };