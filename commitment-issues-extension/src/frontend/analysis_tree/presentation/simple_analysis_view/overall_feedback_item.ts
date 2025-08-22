import * as vscode from 'vscode';
import { AnalysisTreeItem } from "../analysis_tree_item";

export class OverallFeedbackRootItem extends AnalysisTreeItem {
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

export class OverallFeedbackPreviewItem extends AnalysisTreeItem {
  constructor(public readonly styleComment: string) {
    const preview = (styleComment ?? "").length > 100
        ? (styleComment ?? "").slice(0, 100).trim() +
        "…"
        : styleComment ?? "";
    super(preview + (preview.length < styleComment.length ? " (CLICK TO VIEW FULL TEXT)" : ""), vscode.TreeItemCollapsibleState.None);
    this.iconPath = new vscode.ThemeIcon(
      "quote",
      new vscode.ThemeColor("charts.green")
    );
    this.tooltip = preview.length < styleComment.length
        ? `(CLICK TO VIEW FULL TEXT) ${(preview ?? "")}` : styleComment;
    this.command = {
      command: "commitment-issues.showOverallFeedbackFull",
      title: "Open Full Overall Feedback",
    };
  }
  contextValue = "overall-style-preview";
}