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
  githubToken: string,
  branch?: string,
  author?: string,
  perPage: number = 20
): Promise<Commit[]> {
  const { owner, repo } = parseRepoUrl(repoUrl);

  try {
    // get repo details for default branch
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

    // filter by last X commits and by branch
    const commitParams: any = { per_page: perPage };
    commitParams.sha = branch || defaultBranch;

    // get open issues/tasks
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

    const commitsUrl = `https://api.github.com/repos/${owner}/${repo}/commits`;
    const response = await axios.get(commitsUrl, {
      headers: {
        Authorization: `token ${githubToken}`,
        Accept: "application/vnd.github.v3+json",
      },
      params: commitParams,
    });

    let commitsData = response.data;
    if (author) {
      const authorLower = author.toLowerCase();
      commitsData = commitsData.filter((commitObj: any) => {
        const commitAuthor =
          commitObj.commit.author?.name?.toLowerCase() ||
          commitObj.author?.login?.toLowerCase() ||
          "";
        return commitAuthor.includes(authorLower);
      });
    }

    return commitsData.map((commitObj: any) => {
      const commitHash = commitObj?.sha || "";
      const fullMessage = commitObj?.commit?.message || "";
      const [header, ...bodyLines] = fullMessage.split("\n");
      const body = bodyLines.join("\n").trim();
      const authorName =
        commitObj?.commit?.author?.name ||
        commitObj?.author?.login ||
        "Unknown";

      const htmlUrl = commitObj?.html_url || "";

      // find all issue/PR references
      const referencedTasks: string[] = [];
      const taskRegex =
        /#(\d+)|https:\/\/github\.com\/[^\/]+\/[^\/]+\/(issues|pull)\/(\d+)/g;

      let match;
      while ((match = taskRegex.exec(fullMessage)) !== null) {
        if (match[1]) {
          referencedTasks.push(
            `https://github.com/${owner}/${repo}/issues/${match[1]}`
          );
        } else {
          referencedTasks.push(match[0]);
        }
      }

      return new Commit(
        commitHash,
        header,
        body,
        htmlUrl,
        authorName,
        branch || defaultBranch,
        repoHasOpenTasks,
        referencedTasks
      );
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
