import { fetchCommitMessages } from "./github_api";
import { GenerativeAI } from "./interface_generative_ai";
import { GradedCommit } from "./graded_commit";
import { GradedCommitDisplay } from "./graded_commit_display";
import { Commit } from "./commit";

export async function analyzeCommitsFromRepo(
  repoUrl: string,
  githubToken: string,
  generativeAIModel: GenerativeAI
): Promise<string> {
  const commits: Commit[] = await fetchCommitMessages(repoUrl, githubToken);

  const response: string = await generativeAIModel.analyzeCommits(commits);

  const gradedCommits: GradedCommit[] = JSON.parse(response);

  const htmlResponses = gradedCommits.map((gradedCommit: GradedCommit) => {
    const originalCommit = commits.find(
      (c) => c.commitHash == gradedCommit.commitHash
    );

    const display = new GradedCommitDisplay(originalCommit, gradedCommit);
    return display.getHTML();
  });

  return htmlResponses.join("<br>");
}
