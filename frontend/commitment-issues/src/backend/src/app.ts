import express from "express";
import { Gemini } from "./ai/gemini";
import { GenerativeAI } from "./ai/interface_generative_ai";
import { GradedCommit } from "./models/graded_commit";
import { GradedCommitDisplay } from "./presentation/graded_commit_display";
import { fetchCommitMessages } from "./functionality/github_api";
import { analyzeCommitsFromRepo } from "./functionality/commit_analysis";
import { Commit } from "./models/commit";
import { DefaultData } from "./ai/defaultdata";
import { Server } from "http";
import { ConfigurationManager } from "../../settings";

const app = express();
const port = 3066;
const fulladdress = `http://localhost:${port}`;
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

    if (!ConfigurationManager.repo && ConfigurationManager.github.indexOf("<") === -1) {
      return res.status(400).json({ error: "Missing repoUrl parameter" });
    }
    if (!isValid(ConfigurationManager.github)) {
      return res
        .status(500)
        .json({ error: "GitHub token not set" });
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
      return res
        .status(500)
        .json({ error: "GitHub token not set" });
    }

    try {
      const html = await analyzeCommitsFromRepo(
        ConfigurationManager.repo,
        ConfigurationManager.github,
        generativeAIModel,
        ConfigurationManager.branch,
        ConfigurationManager.user,
        ConfigurationManager.amount
      );
      res.send(html);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return server;
}

function isValid(val: string | undefined): boolean {
  return !val == false && val.indexOf("<") === -1;
}

export { backend };