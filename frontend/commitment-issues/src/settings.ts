import * as vscode from 'vscode';

export enum ExtensionConfigurationSettings {
    root = "CommitmentIssues",
    gemini = "geminiApiKey",
    github = "githubAccessToken",
    repoUrl = "repositoryUrl",
    branch = "branchToAnalyze",
    user = "userToAnalyze",
    amountOfCommits = "amountOfCommitsToAnalyze",
};

export abstract class ConfigurationManager {
    static extensionConfigRoot: string = ExtensionConfigurationSettings.root;
    static config(): vscode.WorkspaceConfiguration {
        return vscode.workspace.getConfiguration(this.extensionConfigRoot);
    }
    static get<T>(setting: string): T | undefined {
        return this.config().get<T>(setting);
    }
    static set<T>(setting: string, value: T): Thenable<void> {
        return this.config().update(setting, value, vscode.ConfigurationTarget.Global);
    }
    static get github(): string | undefined {
        return this.get<string>(ExtensionConfigurationSettings.github) || "<set GitHub fine-grained access token here>";
    }
    static get gemini(): string {
        return this.get<string>(ExtensionConfigurationSettings.gemini) || "<set Gemini API key here>";
    }

    static get repo(): string {
        return this.get<string>(ExtensionConfigurationSettings.repoUrl) || "<set repository URL here>";
    }
    static get branch(): string {
        return this.get<string>(ExtensionConfigurationSettings.branch) || "";
    }
    static get user(): string {
        return this.get<string>(ExtensionConfigurationSettings.user) || "";
    }
    static get amount(): number {
        return this.get<number>(ExtensionConfigurationSettings.amountOfCommits) || 24;
    }
}