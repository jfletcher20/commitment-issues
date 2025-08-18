import * as vscode from 'vscode';
import { backend } from './backend/src/app';
import { Server } from 'http';
import { AnalysisResultsProvider } from './frontend/analysis_tree/data/analysis_results_data_provider';
import { ConfigurationManager } from './settings';
export enum VSCodeExtensionViews {
    COMMIT_MESSAGES = "commits-list",
    ANALYZED_COMMIT_MESSAGES = "analyzed-commits-list",
    ROOT_COMMIT_ANALYSIS_RESULTS = "commitment-issues-analyze-view"
}
var _backendServer: Server | undefined;
export function activate(context: vscode.ExtensionContext) {

	_backendServer = backend();
	console.log("Commitment Issues extension active. Thank you for installing our extension! -Noa and Joshua.");

	const commitAnalysisProvider = new AnalysisResultsProvider(context);
	vscode.window.registerTreeDataProvider(VSCodeExtensionViews.ROOT_COMMIT_ANALYSIS_RESULTS, commitAnalysisProvider);

	context.subscriptions.push(
		vscode.commands.registerCommand("commitment-issues.openConfig", () => {
			vscode.commands.executeCommand("workbench.action.openSettings", "Commitment Issues config");
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand("commitment-issues.analyzeCommitMessages", async () => {
			vscode.window.withProgress({
				location: vscode.ProgressLocation.Notification,
				title: `Analyzing ${ConfigurationManager.amount} commits on ${ConfigurationManager.branch}...`,
				cancellable: false
			}, async (progress) => {
				await commitAnalysisProvider.analyze();
				vscode.window.showInformationMessage("Analysis complete!");
			});
		})
	);


	context.subscriptions.push(
		vscode.commands.registerCommand("commitment-issues.showWelcome", async () => {
			const panel = vscode.window.createWebviewPanel(
				"commitmentIssuesWelcome",
				"Extension Status",
				vscode.ViewColumn.One,
				{}
			);

			const response = await fetch("http://localhost:3066/");
			const html = await response.text();
			panel.webview.html = html;
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand("commitment-issues.analyzeCommits", async () => {
			const panel = vscode.window.createWebviewPanel(
				"commitmentIssuesAnalyze",
				"Commit Message Analysis Results (HTML)",
				vscode.ViewColumn.One,
				{}
			);

			const response = await fetch("http://localhost:3066/analyze-commits");
			const html = await response.text();
			panel.webview.html = html;
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand("commitment-issues.analyzeCommitsJson", async () => {
			const panel = vscode.window.createWebviewPanel(
				"commitmentIssuesAnalyze",
				"Commit Message Analysis Results (JSON)",
				vscode.ViewColumn.One,
				{}
			);

			const response = await fetch("http://localhost:3066/analyze-commits?format=json");
			const json = await response.json();
			panel.webview.html = JSON.stringify(json, null, 2);
		})
	);
}

export function deactivate() {
	_backendServer?.close(() => {
		console.log("Commitment Issues server closed.");
	});
}