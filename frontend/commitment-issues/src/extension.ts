import * as vscode from 'vscode';
import { backend } from './backend/src/app';
import { Server } from 'http';

var _backendServer: Server | undefined;
export function activate(context: vscode.ExtensionContext) {
	console.log('Commitment Issues extension active. Thank you for installing our extension! -Noa and Joshua.');
	context.subscriptions.push(
		vscode.commands.registerCommand('commitment-issues.openConfig', () => {
			vscode.commands.executeCommand('workbench.action.openSettings', 'Commitment Issues config');
		})
	);

	_backendServer = backend();

	context.subscriptions.push(
		vscode.commands.registerCommand('commitment-issues.showWelcome', async () => {
			const panel = vscode.window.createWebviewPanel(
				'commitmentIssuesWelcome',
				'Commitment Issues Welcome',
				vscode.ViewColumn.One,
				{}
			);

			const response = await fetch('http://localhost:3066/');
			const html = await response.text();
			panel.webview.html = html;
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('commitment-issues.analyzeCommits', async () => {
			const panel = vscode.window.createWebviewPanel(
				'commitmentIssuesAnalyze',
				'Analyze Commits',
				vscode.ViewColumn.One,
				{}
			);

			const response = await fetch('http://localhost:3066/analyze-commits');
			const html = await response.text();
			panel.webview.html = html;
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('commitment-issues.analyzeCommitsJson', async () => {
			const panel = vscode.window.createWebviewPanel(
				'commitmentIssuesAnalyze',
				'Analyze Commits',
				vscode.ViewColumn.One,
				{}
			);

			const response = await fetch('http://localhost:3066/analyze-commits?format=json');
			const json = await response.json();
			panel.webview.html = JSON.stringify(json, null, 2);
		})
	);
}

export function deactivate() {
	_backendServer?.close(() => {
		console.log('Commitment Issues server closed.');
	});
}