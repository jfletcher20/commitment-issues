import * as vscode from 'vscode';
import { AnalysisTreeItem } from "./analysis_tree_item";
import { AnalysisResultsProvider } from '../data/analysis_results_data_provider';

export class ViolationTreeItem extends AnalysisTreeItem {
	constructor(
		extensionRoot: vscode.Uri,
		private readonly ruleNumber: number,
		private readonly ruleName: string
	) {
		super(`Rule ${ruleNumber}`, vscode.TreeItemCollapsibleState.None);
		this.description = AnalysisResultsProvider.truncateHeader(ruleName);
		this.tooltip = `Rule ${ruleNumber}: ${ruleName}`;
		this.iconPath = new vscode.ThemeIcon("error", new vscode.ThemeColor("charts.red"));
	}

	contextValue = "violation";
}

