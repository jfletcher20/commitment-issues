import { Commit } from "../models/commit";

export interface GenerativeAI {
  test(): Promise<string>;
  getContents(): string;
  analyzeCommits(commits: Commit[]): Promise<string>;
}
