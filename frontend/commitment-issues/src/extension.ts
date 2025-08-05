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

	// register a command that calls the "/" route of the backend server and displays the response in a webview
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
}

export function deactivate() {
	_backendServer?.close(() => {
		console.log('Commitment Issues server closed.');
	});
}