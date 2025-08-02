import axios from "axios";
import { Commit } from "./commit";

function parseRepoUrl(repoUrl: string) {
  const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)(?:\.git)?/);
  if (!match) {
    throw new Error("Invalid GitHub repository URL.");
  }
  return { owner: match[1], repo: match[2] };
}

/**
 * Fetch commits from GitHub API.
 * Returns array of Commit objects (hash, header, body).
 */
export async function fetchCommitMessages(
  repoUrl: string,
  githubToken: string
): Promise<Commit[]> {
  const { owner, repo } = parseRepoUrl(repoUrl);

  try {
    const commitsUrl = `https://api.github.com/repos/${owner}/${repo}/commits`;

    const response = await axios.get(commitsUrl, {
      headers: {
        Authorization: `token ${githubToken}`,
        Accept: "application/vnd.github.v3+json",
      },
      params: { per_page: 20 },
    });

    return response.data.map((commitObj: any) => {
      const commitHash = commitObj.sha;
      const fullMessage = commitObj.commit.message;
      const [header, ...bodyLines] = fullMessage.split("\n");
      const body = bodyLines.join("\n").trim();

      return new Commit(commitHash, header, body);
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
