import { GradedCommit } from "./graded_commit";

class GradedCommitDisplay {
    constructor(public gradedCommit: GradedCommit) {
        this.gradedCommit = gradedCommit;
    }

    getHTML(): string {
        const gradeColor = this.getGradeColor(5 - this.gradedCommit.violations.length);
        return `
            <div style="
                background-color: #1e1e1e;
                color: #f5f5f5;
                border-left: 6px solid ${gradeColor};
                border-radius: 8px;
                padding: 16px;
                margin: 12px 0;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                font-family: 'Segoe UI', sans-serif;
                max-width: 600px;
            ">
                <div style="margin-bottom: 12px;">
                    <h3 style="margin: 0 0 6px;">💾 Commit</h3>
                    <pre style="
                        background-color: #2a2a2a;
                        padding: 12px;
                        border-radius: 6px;
                        white-space: pre-wrap;
                        font-family: monospace;
                        overflow-x: auto;
                    ">${this.escapeHTML(this.gradedCommit.commit)}</pre>
                </div>

                <p><strong>Grade:</strong> <span style="color: ${gradeColor}; font-weight: bold;">${5 - this.gradedCommit.violations.length}</span></p>

                <div style="margin: 8px 0;">
                    <p style="margin: 0;"><strong>Violations:</strong></p>
                    <ul style="margin-top: 4px; padding-left: 20px;">
                        ${this.gradedCommit.violations.map(v =>
                            `<li>Rule <code>${v.rule}</code></li>`
                        ).join('')}
                    </ul>
                </div>

                <p><strong>Suggestion:</strong> ${this.escapeHTML(this.gradedCommit.suggestion || "No suggestion provided.")}</p>
            </div>
        `;
    }

    private getGradeColor(grade: number): string {
        switch (grade) {
            case 0: return 'red';
            case 1: return 'orange';
            case 2: return 'yellow';
            case 3: return 'green';
            case 4: return 'blue';
            case 5: return 'purple';
            default: return 'gray';
        }
    }

    private escapeHTML(input: string): string {
        return input.replace(/[&<>"']/g, function (match) {
            switch (match) {
                case "&": return "&amp;";
                case "<": return "&lt;";
                case ">": return "&gt;";
                case "\"": return "&quot;";
                case "'": return "&#039;";
                default: return match;
            }
        });
    }
}

export { GradedCommitDisplay };