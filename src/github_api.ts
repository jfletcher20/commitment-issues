import axios from "axios";

/**
 * Extracts owner and repo from a GitHub repo URL
 * Example: https://github.com/user/repo -> { owner: "user", repo: "repo" }
 */
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
) {
  const { owner, repo } = parseRepoUrl(repoUrl);

  const commitsUrl = `https://api.github.com/repos/${owner}/${repo}/commits`;

  const response = await axios.get(commitsUrl, {
    headers: {
      Authorization: `token ${githubToken}`,
      Accept: "application/vnd.github.v3+json",
    },
    params: {
      per_page: 10, // no of commit messages, limit for now
    },
  });

  return response.data.map((commitObj: any) => commitObj.commit.message);
}
