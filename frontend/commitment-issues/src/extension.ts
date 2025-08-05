import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	console.log('Commitment Issues extension active. Thank you for installing our extension! -Noa and Joshua.');
	context.subscriptions.push(
		vscode.commands.registerCommand('commitment-issues.openConfig', () => {
			vscode.commands.executeCommand('workbench.action.openSettings', 'Commitment Issues config');
		})
	);

}

export function deactivate() { }