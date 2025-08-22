import * as vscode from 'vscode';
import { AnalysisTreeItem } from "../analysis_tree_item";

export type RuleStat = { rule: number; name: string; count: number; total: number };

export class RuleStatsRootItem extends AnalysisTreeItem {
  constructor(public readonly avg: number | undefined) {
    super("Rule Violation Stats", vscode.TreeItemCollapsibleState.Collapsed);
    this.iconPath = new vscode.ThemeIcon(
      "graph",
      new vscode.ThemeColor("charts.blue")
    );
    this.tooltip = "Summary of violations per rule (count/total)";
    this.description = "Average grade: ☆ " + (avg !== undefined ? avg.toPrecision(3).toString() + "/5": "N/A");
  }
  contextValue = "rule-stats-root";
}

export class RuleStatItem extends AnalysisTreeItem {
  constructor(public readonly stat: RuleStat) {
    super(
      `Rule ${stat.rule}`,
      vscode.TreeItemCollapsibleState.None
    );
    this.description = `${stat.name.split(":")[0]}: ${stat.count}/${stat.total}`;
    this.tooltip = `Violations found in ${stat.count}/${stat.total} commit${stat.count === 1 ? "" : "s"}\n\n${stat.name}`;
    this.iconPath = new vscode.ThemeIcon(
      "warning",
      new vscode.ThemeColor("charts.red")
    );
  }
  contextValue = "rule-stat";
}
