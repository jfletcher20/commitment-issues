import * as vscode from "vscode";
import { Commit } from "../../../backend/src/models/commit";
import { GradedCommit } from "../../../backend/src/models/graded_commit";
import { GradedCommitDisplay } from "../../../backend/src/presentation/graded_commit_display";
import { DefaultData } from "../../../backend/src/ai/defaultdata";
import { AnalysisTreeItem } from "../presentation/analysis_tree_item";
import { CommitTreeItem } from "../presentation/commit_tree_item";
import { SuggestionTreeItem } from "../presentation/suggestion_tree_item";
import { ViolationTreeItem } from "../presentation/violation_tree_item";

export class AnalysisResultsProvider
  implements vscode.TreeDataProvider<AnalysisTreeItem>
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    AnalysisTreeItem | undefined | void
  > = new vscode.EventEmitter<AnalysisTreeItem | undefined | void>();
  readonly onDidChangeTreeData: vscode.Event<
    AnalysisTreeItem | undefined | void
  > = this._onDidChangeTreeData.event;

  private analysisResults: GradedCommitDisplay[] = [];
  private styleComment: string | undefined;
  private styleStats?: {
    rule: number;
    name: string;
    count: number;
    total: number;
  }[];

  constructor(private readonly context: vscode.ExtensionContext) {
    // show full comment in a wrapped HTML webview
    context.subscriptions.push(
      vscode.commands.registerCommand(
        "commitment-issues.showOverallFeedbackFull",
        () => {
          const text = this.styleComment ?? "(no feedback)";
          const panel = vscode.window.createWebviewPanel(
            "commitmentIssuesOverall",
            "Overall Style Feedback",
            vscode.ViewColumn.Two,
            { enableScripts: false }
          );
          panel.webview.html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <style>
      body{ background:#1e1e1e; color:#ddd; font-family: -apple-system,Segoe UI,Ubuntu,Roboto,Helvetica,Arial,sans-serif; padding:16px; }
      h1{ color:#ffd166; font-size:18px; margin:0 0 12px 0; }
      .box{
        background:#2a2a2a; border-left:5px solid #ffd166; border-radius:8px;
        padding:12px 14px; line-height:1.5; white-space:pre-wrap; word-wrap:break-word;
      }
    </style>
  </head>
  <body>
    <h1>Overall Style Feedback</h1>
    <div class="box">${escapeHtml(text)}</div>
  </body>
</html>`;
        }
      )
    );
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  async analyze(): Promise<void> {
    try {
      // first, detailed analysis (per commit)
      const response = await fetch(
        "http://localhost:3066/analyze-commits?format=json"
      );
      if (response.ok) {
        const jsonData = await response.json();
        this.analysisResults = jsonData.map(
          (item: any) =>
            new GradedCommitDisplay(
              new Commit(
                item.commit.commitHash,
                item.commit.header,
                item.commit.body,
                item.commit.url,
                item.commit.authorName,
                item.commit.branch,
                item.commit.repoHasOpenTasks,
                item.commit.referencedTasks
              ),
              new GradedCommit(
                item.gradedCommit.commitHash,
                item.gradedCommit.violations,
                item.gradedCommit.suggestion,
                item.gradedCommit.bodySuggestion
              )
            )
        );

        // second, overall style comment
        const sc = await fetch("http://localhost:3066/style-comment");
        if (sc.ok) {
          const { styleComment, stats } = await sc.json();
          this.styleComment = styleComment;
          this.styleStats = stats;
          console.log("[AnalysisResultsProvider] Rule stats:", stats);
        } else {
          this.styleComment = undefined;
          this.styleStats = undefined;
        }

        this.refresh();
      } else {
        vscode.window.showErrorMessage(
          "Failed to analyze commitment issues. Make sure you've configured the extension with the appropriate API keys and repository URL. You can check if the backend is running via the 'Commitment Issues: Check Extension Status' command."
        );
      }
    } catch (error) {
      vscode.window.showErrorMessage(
        `Error occurred during analysis: ${error}`
      );
    }
  }

  getTreeItem(element: AnalysisTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: AnalysisTreeItem): Thenable<AnalysisTreeItem[]> {
    // ROOT LEVEL
    if (!element) {
      const rootItems: AnalysisTreeItem[] = [];

      // overall feedback at top (expanded)
      if (this.styleComment && this.styleComment.trim().length > 0) {
        rootItems.push(new OverallFeedbackRootItem());
      }

      // rule stats node (optional)
      if (this.styleStats && this.styleStats.length > 0) {
        rootItems.push(new RuleStatsRootItem());
      }

      // commits root (collapsed), contains all commits
      if (this.analysisResults.length > 0) {
        rootItems.push(new CommitsRootItem(this.analysisResults.length));
      }

      return Promise.resolve(rootItems);
    }

    // OVERALL FEEDBACK CHILD: single row with preview, click opens full wrapped view
    if (element instanceof OverallFeedbackRootItem) {
      const preview =
        (this.styleComment ?? "").length > 180
          ? (this.styleComment ?? "").slice(0, 180) +
            " … (click to view full text)"
          : this.styleComment ?? "";
      return Promise.resolve([new OverallFeedbackPreviewItem(preview)]);
    }

    // RULE STATS CHILDREN
    if (element instanceof RuleStatsRootItem) {
      const items = (this.styleStats ?? []).map((s) => new RuleStatItem(s));
      return Promise.resolve(items);
    }

    // COMMITS ROOT CHILDREN
    if (element instanceof CommitsRootItem) {
      const commitItems = this.analysisResults.map((result) => {
        const getCollapsibleState = (gradedCommit: GradedCommit) => {
          if (gradedCommit.grade < 5)
            return vscode.TreeItemCollapsibleState.Expanded;
          if (gradedCommit.bodySuggestion || gradedCommit.suggestion)
            return vscode.TreeItemCollapsibleState.Expanded;
          return vscode.TreeItemCollapsibleState.None;
        };
        return new CommitTreeItem(
          this.context.extensionUri,
          result.commit,
          result.gradedCommit,
          getCollapsibleState(result.gradedCommit)
        );
      });
      return Promise.resolve(commitItems);
    }

    // EXISTING COMMIT SUBTREE
    if (element instanceof CommitTreeItem) {
      const items: AnalysisTreeItem[] = [];
      const grade = element.gradedCommit.grade;

      if (element.gradedCommit.violations.length > 0) {
        element.gradedCommit.violations.forEach((violation) => {
          const ruleName =
            DefaultData.rules.get(violation.rule) || "Unknown rule";
          items.push(
            new ViolationTreeItem(
              this.context.extensionUri,
              violation.rule,
              ruleName
            )
          );
        });
      }

      if (element.gradedCommit.suggestion) {
        items.push(
          new SuggestionTreeItem(
            this.context.extensionUri,
            "New Header",
            element.gradedCommit.suggestion,
            grade
          )
        );
      }

      if (element.gradedCommit.bodySuggestion) {
        items.push(
          new SuggestionTreeItem(
            this.context.extensionUri,
            "New Body",
            element.gradedCommit.bodySuggestion,
            grade
          )
        );
      }

      return Promise.resolve(items);
    }

    return Promise.resolve([]);
  }

  public static themeColor(grade: number): vscode.ThemeColor {
    switch (grade) {
      case 0:
        return new vscode.ThemeColor("charts.red");
      case 1:
        return new vscode.ThemeColor("charts.orange");
      case 2:
        return new vscode.ThemeColor("charts.yellow");
      case 3:
        return new vscode.ThemeColor("charts.green");
      case 4:
        return new vscode.ThemeColor("charts.blue");
      case 5:
        return new vscode.ThemeColor("charts.purple");
      default:
        return new vscode.ThemeColor("charts.foreground");
    }
  }

  public static truncateHeader(header: string): string {
    return header.length > 50 ? header.substring(0, 47) + "..." : header;
  }
}

type RuleStat = { rule: number; name: string; count: number; total: number };

class OverallFeedbackRootItem extends AnalysisTreeItem {
  constructor() {
    super("Overall Style Feedback", vscode.TreeItemCollapsibleState.Expanded);
    this.iconPath = new vscode.ThemeIcon(
      "lightbulb",
      new vscode.ThemeColor("charts.yellow")
    );
    this.tooltip = "General feedback on commit-message style";
  }
  contextValue = "overall-style-root";
}

class OverallFeedbackPreviewItem extends AnalysisTreeItem {
  constructor(public readonly preview: string) {
    super(preview, vscode.TreeItemCollapsibleState.None);
    this.iconPath = new vscode.ThemeIcon(
      "quote",
      new vscode.ThemeColor("charts.green")
    );
    this.tooltip = preview;
    this.command = {
      command: "commitment-issues.showOverallFeedbackFull",
      title: "Open Full Overall Feedback",
    };
  }
  contextValue = "overall-style-preview";
}

class RuleStatsRootItem extends AnalysisTreeItem {
  constructor() {
    super("Rule Stats", vscode.TreeItemCollapsibleState.Expanded);
    this.iconPath = new vscode.ThemeIcon(
      "graph",
      new vscode.ThemeColor("charts.blue")
    );
    this.tooltip = "Summary of violations per rule (count/total)";
  }
  contextValue = "rule-stats-root";
}

class RuleStatItem extends AnalysisTreeItem {
  constructor(public readonly stat: RuleStat) {
    super(
      `Rule ${stat.rule}: ${stat.name}`,
      vscode.TreeItemCollapsibleState.Collapsed
    );
    this.description = `${stat.count}/${stat.total}`;
    this.tooltip = `Violations for "${stat.name}": ${stat.count} of ${stat.total} commits`;
    this.iconPath = new vscode.ThemeIcon(
      "warning",
      new vscode.ThemeColor("charts.red")
    );
  }
  contextValue = "rule-stat";
}

class CommitsRootItem extends AnalysisTreeItem {
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

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (m) =>
    m === "&"
      ? "&amp;"
      : m === "<"
      ? "&lt;"
      : m === ">"
      ? "&gt;"
      : m === '"'
      ? "&quot;"
      : "&#39;"
  );
}
