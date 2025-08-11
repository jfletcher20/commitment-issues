import * as vscode from 'vscode';
import { Commit } from '../../../backend/src/models/commit';
import { GradedCommit } from '../../../backend/src/models/graded_commit';
import { GradedCommitDisplay } from '../../../backend/src/presentation/graded_commit_display';
import { DefaultData } from '../../../backend/src/ai/defaultdata';
import { AnalysisTreeItem } from '../presentation/analysis_tree_item';
import { CommitTreeItem } from '../presentation/commit_tree_item';
import { SuggestionTreeItem } from '../presentation/suggestion_tree_item';
import { ViolationTreeItem } from '../presentation/violation_tree_item';

export class AnalysisResultsProvider implements vscode.TreeDataProvider<AnalysisTreeItem> {

	private _onDidChangeTreeData: vscode.EventEmitter<AnalysisTreeItem | undefined | void> = new vscode.EventEmitter<AnalysisTreeItem | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<AnalysisTreeItem | undefined | void> = this._onDidChangeTreeData.event;

	private analysisResults: GradedCommitDisplay[] = [];

	constructor(private readonly context: vscode.ExtensionContext) { }

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	async analyze(): Promise<void> {
		try {
			const response = await fetch("http://localhost:3066/analyze-commits?format=json");
			if (response.ok) {
				const jsonData = await response.json();
				this.analysisResults = jsonData.map((item: any) =>
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
				this.refresh();
			} else {
				vscode.window.showErrorMessage("Failed to analyze commitment issues. Make sure you've configured the extension with the appropriate API keys and repository URL. You can check if the backend is running via the 'Commitment Issues: Check Extension Status' command.");
			}
		} catch (error) {
			vscode.window.showErrorMessage(`Error occurred during analysis: ${error}`);
		}
	}

	getTreeItem(element: AnalysisTreeItem): vscode.TreeItem {
		return element;
	}

	getChildren(element?: AnalysisTreeItem): Thenable<AnalysisTreeItem[]> {
		if (!element) {
			return Promise.resolve(
				this.analysisResults.map((result) => {
					const getCollapsibleState = (gradedCommit: GradedCommit) => {
						if (gradedCommit.grade < 5) return vscode.TreeItemCollapsibleState.Expanded;
						if (gradedCommit.bodySuggestion || gradedCommit.suggestion) return vscode.TreeItemCollapsibleState.Expanded;
						return vscode.TreeItemCollapsibleState.None;
					};
					return new CommitTreeItem(
						this.context.extensionUri,
						result.commit,
						result.gradedCommit,
						getCollapsibleState(result.gradedCommit)
					);
				})
			);
		} else if (element instanceof CommitTreeItem) {
			const items: AnalysisTreeItem[] = [];

			const grade = element.gradedCommit.grade;

			if (element.gradedCommit.violations.length > 0) {
				element.gradedCommit.violations.forEach(violation => {
					const ruleName = DefaultData.rules.get(violation.rule) || "Unknown rule";
					items.push(new ViolationTreeItem(this.context.extensionUri, violation.rule, ruleName));
				});
			}

			if (element.gradedCommit.suggestion) {
				items.push(new SuggestionTreeItem(
					this.context.extensionUri,
					"New Header",
					element.gradedCommit.suggestion,
					grade
				));
			}

			if (element.gradedCommit.bodySuggestion) {
				items.push(new SuggestionTreeItem(
					this.context.extensionUri,
					"New Body",
					element.gradedCommit.bodySuggestion,
					grade
				));
			}

			return Promise.resolve(items);
		}

		return Promise.resolve([]);
	}

	public static themeColor(grade: number): vscode.ThemeColor {
		switch (grade) {
			case 0: return new vscode.ThemeColor("charts.red");
			case 1: return new vscode.ThemeColor("charts.orange");
			case 2: return new vscode.ThemeColor("charts.yellow");
			case 3: return new vscode.ThemeColor("charts.green");
			case 4: return new vscode.ThemeColor("charts.blue");
			case 5: return new vscode.ThemeColor("charts.purple");
			default: return new vscode.ThemeColor("charts.foreground");
		}
	}

	public static truncateHeader(header: string): string {
		return header.length > 50 ? header.substring(0, 47) + "..." : header;
	}
}
