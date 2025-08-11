import * as vscode from 'vscode';
import { AnalysisTreeItem } from './analysis_tree_item';
import { AnalysisResultsProvider } from '../data/analysis_results_data_provider';
export class SuggestionTreeItem extends AnalysisTreeItem {
	constructor(
		extensionRoot: vscode.Uri,
		private readonly suggestionType: string,
		private readonly suggestion: string,
		private readonly grade: number
	) {
		super(suggestionType, vscode.TreeItemCollapsibleState.None);
		this.description = AnalysisResultsProvider.truncateHeader(suggestion);
		this.tooltip = `${suggestionType}: ${suggestion}`;
		this.iconPath = new vscode.ThemeIcon("lightbulb", AnalysisResultsProvider.themeColor(-1));
	}

	contextValue = "suggestion";
}