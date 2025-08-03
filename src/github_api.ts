import axios from "axios";
import { Commit } from "./commit";

function parseRepoUrl(repoUrl: string) {
  const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)(?:\.git)?/);
  if (!match) {
    throw new Error("Invalid GitHub repository URL.");
  }
  return { owner: match[1], repo: match[2] };
}

export async function fetchCommitMessages(
  repoUrl: string,
  githubToken: string
): Promise<Commit[]> {
  const { owner, repo } = parseRepoUrl(repoUrl);

  try {
    // Get repo details for default branch
    const repoInfo = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}`,
      {
        headers: {
          Authorization: `token ${githubToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );
    const defaultBranch = repoInfo.data.default_branch || "main";

    // Get open issues/tasks
    const issuesRes = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/issues`,
      {
        headers: {
          Authorization: `token ${githubToken}`,
          Accept: "application/vnd.github.v3+json",
        },
        params: { state: "open", per_page: 100 },
      }
    );
    const issueNumbers = issuesRes.data.map((issue: any) => issue.number);
    const repoHasOpenTasks = issueNumbers.length > 0;

    // Get recent commits
    const commitsUrl = `https://api.github.com/repos/${owner}/${repo}/commits`;
    const response = await axios.get(commitsUrl, {
      headers: {
        Authorization: `token ${githubToken}`,
        Accept: "application/vnd.github.v3+json",
      },
      params: { per_page: 20, sha: defaultBranch }, // limit & branch filter
    });

    return response.data.map((commitObj: any) => {
      const commitHash = commitObj.sha;
      const fullMessage = commitObj.commit.message;
      const [header, ...bodyLines] = fullMessage.split("\n");
      const body = bodyLines.join("\n").trim();
      const authorName =
        commitObj.commit.author?.name || commitObj.author?.login || "Unknown";

      // Find all issue/PR references as full links or number #123
      const referencedTasks: string[] = [];
      const taskRegex =
        /#(\d+)|https:\/\/github\.com\/[^\/]+\/[^\/]+\/(issues|pull)\/(\d+)/g;

      let match;
      while ((match = taskRegex.exec(fullMessage)) !== null) {
        if (match[0].startsWith("#")) {
          // Convert #123 into full repo URL
          referencedTasks.push(
            `https://github.com/${owner}/${repo}/issues/${match[1]}`
          );
        } else {
          referencedTasks.push(match[0]);
        }
      }

      let c = new Commit(
        commitHash,
        header,
        body,
        commitObj.html_url,
        authorName,
        defaultBranch,
        repoHasOpenTasks,
        referencedTasks
      );

      return c;
    });
  } catch (error: any) {
    if (error.response?.status === 404) {
      throw new Error(
        "Access forbidden, check if the repository is public or if the URL is correct."
      );
    }
    throw new Error(`GitHub API error: ${error.message}`);
  }
}
