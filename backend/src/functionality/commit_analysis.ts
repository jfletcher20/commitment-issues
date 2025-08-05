import { fetchCommitMessages } from "./github_api";
import { GenerativeAI } from "../ai/interface_generative_ai";
import { GradedCommit } from "../models/graded_commit";
import { GradedCommitDisplay } from "../presentation/graded_commit_display";
import { Commit } from "../models/commit";

export async function analyzeCommitsFromRepo(
  repoUrl: string,
  githubToken: string,
  generativeAIModel: GenerativeAI,
  branch?: string,
  author?: string,
  perPage?: number
): Promise<string> {
  const commits: Commit[] = await fetchCommitMessages(
    repoUrl,
    githubToken,
    branch,
    author,
    perPage
  );

  const response: string = await generativeAIModel.analyzeCommits(commits);

  const gradedCommits: GradedCommit[] = JSON.parse(response);

  const htmlResponses = gradedCommits.map((gradedCommit: GradedCommit) => {
    const originalCommit = commits.find((c) => {
      return c.commitHash === gradedCommit.commitHash;
    });

    const display = new GradedCommitDisplay(originalCommit, gradedCommit);

    return display.getHTML();
  });

  return htmlResponses.join("<br>");
}
