import { Commit } from "./commit";

export interface GenerativeAI {
  test(): Promise<string>;
  getContents(): string;
  analyzeCommits(commits: Commit[]): Promise<string>;
}
