import * as vscode from 'vscode';
import { AnalysisTreeItem } from "../analysis_tree_item";
import { Commit } from '../../../../backend/src/models/commit';
import { GradedCommit } from '../../../../backend/src/models/graded_commit';
import { AnalysisResultsProvider } from '../../data/analysis_results_data_provider';

export class CommitsRootItem extends AnalysisTreeItem {
  constructor(count: number) {
    super(
      `Detailed View by Commit (${count})`,
      vscode.TreeItemCollapsibleState.Collapsed
    );
    this.iconPath = new vscode.ThemeIcon(
      "list-tree",
      new vscode.ThemeColor("charts.foreground")
    );
  }
  contextValue = "commits-root";
}

export class CommitTreeItem extends AnalysisTreeItem {
    constructor(
        extensionRoot: vscode.Uri,
        public readonly commit: Commit,
        public readonly gradedCommit: GradedCommit,
        collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        const shortHeader = AnalysisResultsProvider.truncateHeader(commit.header);
        super(shortHeader, collapsibleState);
        const grade = gradedCommit.grade;

        this.description = `☆ ${grade}/5`;
        this.tooltip =
`${commit.header}${commit.body ? `\n${commit.body}` : ''}

Hash: ${commit.commitHash}
Author: ${commit.authorName}
Grade: ${grade}/5
Violations: ${gradedCommit.violations.length}
Header Suggestion: ${gradedCommit.suggestion || 'None'}
Body Suggestion: ${gradedCommit.bodySuggestion || 'None'}`;

        this.iconPath = new vscode.ThemeIcon("git-commit", AnalysisResultsProvider.themeColor(grade));

        if (commit.url) {
            this.command = {
                command: "vscode.open",
                title: "Open Commit",
                arguments: [vscode.Uri.parse(commit.url)]
            };
        }
    }

    contextValue = "commit";
}
