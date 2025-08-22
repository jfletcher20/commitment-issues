import express from "express";
import { Gemini } from "./ai/gemini";
import { GenerativeAI } from "./ai/interface_generative_ai";
import { GradedCommitDisplay } from "./presentation/graded_commit_display";
import { fetchCommitMessages } from "./functionality/github_api";
import { analyzeCommitsFromRepo } from "./functionality/commit_analysis";
import { Server } from "http";
import { ConfigurationManager } from "../../settings";

const app = express();
const port = 3066;
const generativeAIModel: GenerativeAI = new Gemini();

function backend(): Server {
  const server = app.listen(port, () => {
    return console.log(`Backend is running at http://localhost:${port}`);
  });

  // default testing route
  app.get("/", (req: any, res: any) => {
    res.send(`
  <body style="background-color:#222; color:white; font-family: sans-serif;">
      <h1 style="color: #0ff;">Commitment Issues</h1>
      <p>Backend is up and running!</p>
  </body>
  `);
  });

  app.get("/fetch-commits", async (req: any, res: any) => {
    if (
      !ConfigurationManager.repo &&
      ConfigurationManager.github.indexOf("<") === -1
    ) {
      return res.status(400).json({ error: "Missing repoUrl parameter" });
    }
    if (!isValid(ConfigurationManager.github)) {
      return res.status(500).json({ error: "GitHub token not set" });
    }

    try {
      const commitMessages = await fetchCommitMessages(
        ConfigurationManager.repo,
        ConfigurationManager.github,
        ConfigurationManager.branch,
        ConfigurationManager.user,
        ConfigurationManager.amount
      );
      res.json({ commits: commitMessages });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/analyze-commits", async (req: any, res: any) => {
    if (!isValid(ConfigurationManager.repo)) {
      return res.status(400).json({ error: "Missing repositoryUrl parameter" });
    }
    if (!isValid(ConfigurationManager.github)) {
      return res.status(500).json({ error: "GitHub token not set" });
    }

    // check query parameters for "format"
    const useJsonFormat: boolean = req.query.format === "json";

    try {
      const analysis = await analyzeCommitsFromRepo(
        ConfigurationManager.repo,
        ConfigurationManager.github,
        generativeAIModel,
        ConfigurationManager.branch,
        ConfigurationManager.user,
        ConfigurationManager.amount
      );
      if (useJsonFormat) {
        res.json(analysis);
      } else {
        res.send(
          analysis.map((a: GradedCommitDisplay) => a.getHTML()).join("<br>")
        );
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/style-comment", async (req: any, res: any) => {
    console.log("[/style-comment] request received");

    if (!isValid(ConfigurationManager.repo)) {
      console.error(
        "[/style-comment] invalid repo:",
        ConfigurationManager.repo
      );
      return res.status(400).json({ error: "Missing repositoryUrl parameter" });
    }
    if (!isValid(ConfigurationManager.github)) {
      console.error(
        "[/style-comment] invalid github token:",
        ConfigurationManager.github
      );
      return res.status(500).json({ error: "GitHub token not set" });
    }

    try {
      console.log("[/style-comment] fetching commits with params:", {
        repo: ConfigurationManager.repo,
        branch: ConfigurationManager.branch,
        user: ConfigurationManager.user,
        amount: ConfigurationManager.amount,
      });

      const commits = await fetchCommitMessages(
        ConfigurationManager.repo,
        ConfigurationManager.github,
        ConfigurationManager.branch,
        ConfigurationManager.user,
        ConfigurationManager.amount
      );

      console.log("[/style-comment] commits fetched:", commits.length);

      const comment = await (generativeAIModel as Gemini).generateStyleComment(
        commits,
        ConfigurationManager.user
      );

      console.log("[/style-comment] generated comment:", comment);

      res.json({ styleComment: comment });
    } catch (error: any) {
      console.error("[/style-comment] ERROR:", error);
      res.status(500).json({ error: error.message || String(error) });
    }
  });

  return server;
}

function isValid(val: string | undefined): boolean {
  return !val == false && val.indexOf("<") === -1;
}

export { backend };
