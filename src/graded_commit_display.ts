import { Commit } from "./commit";
import { DefaultData } from "./defaultdata";
import { GradedCommit } from "./graded_commit";

class GradedCommitDisplay {
  constructor(public commit: Commit, public gradedCommit: GradedCommit) {
    this.commit = commit;
    this.gradedCommit = gradedCommit;
  }

  getHTML(): string {
    const gradeColor = this.getGradeColor(
      5 - this.gradedCommit.violations.length
    );
    return `
        ${
          this.commit.url != undefined
            ? `<style>
            a {
                text-decoration: none;
            }
            a:hover {
                text-decoration: none;
            }
        </style><a href="${
          this.commit.url || "#"
        }" target="_blank" rel="noopener noreferrer">`
            : ""
        }
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
                    <h3 style="margin: 0 0 6px;" id="commit-header">💾 ${
                      this.commit.header
                    }</h3>
                    <p style="margin: 0; color: #888;"><code>${
                      this.commit.body
                    }</code></p>
                    <pre style="
                        background-color: #2a2a2a;
                        padding: 12px;
                        border-radius: 6px;
                        white-space: pre-wrap;
                        font-family: monospace;
                        overflow-x: auto;
                    ">${this.escapeHTML(this.gradedCommit.commitHash)}</pre>
                </div>

                <p><strong>Grade:</strong> <span style="color: ${gradeColor}; font-weight: bold;">${
      5 - this.gradedCommit.violations.length
    }</span></p>

                <div style="margin: 8px 0;">
                    <p style="margin: 0;"><strong>Violations:</strong></p>
                    <ul style="margin-top: 4px; padding-left: 20px;">
                        ${this.gradedCommit.violations
                          .map(
                            (v) =>
                              `<li>Rule <code>${v.rule}</code>&nbsp;${
                                DefaultData.rules.get(v.rule) || "Unknown rule"
                              }</li>`
                          )
                          .join("")}
                    </ul>
                </div>

                <p style="color: ${
                  this.gradedCommit.suggestion ? "" : "#ddd"
                }"><strong>Suggestion:</strong> ${this.escapeHTML(
      this.gradedCommit.suggestion || "No suggestion provided."
    )}</p>
                <p style="color: ${
                  this.gradedCommit.bodySuggestion ? "" : "#ddd"
                }"><strong>Body Suggestion:</strong> ${this.escapeHTML(
      this.gradedCommit.bodySuggestion || "No body suggestion provided."
    )}</p>
            </div>
        ${this.commit.url != undefined ? `</a>` : ""}
        `;
  }

  private getGradeColor(grade: number): string {
    switch (grade) {
      case 0:
        return "red";
      case 1:
        return "orange";
      case 2:
        return "yellow";
      case 3:
        return "green";
      case 4:
        return "blue";
      case 5:
        return "purple";
      default:
        return "gray";
    }
  }

  private escapeHTML(input: string): string {
    return input.replace(/[&<>"']/g, function (match) {
      switch (match) {
        case "&":
          return "&amp;";
        case "<":
          return "&lt;";
        case ">":
          return "&gt;";
        case '"':
          return "&quot;";
        case "'":
          return "&#039;";
        default:
          return match;
      }
    });
  }
}

export { GradedCommitDisplay };
