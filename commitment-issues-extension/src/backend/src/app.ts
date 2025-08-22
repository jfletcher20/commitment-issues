import express from "express";
import { Gemini } from "./ai/gemini";
import { GenerativeAI } from "./ai/interface_generative_ai";
import { GradedCommitDisplay } from "./presentation/graded_commit_display";
import { fetchCommitMessages } from "./functionality/github_api";
import { analyzeCommitsFromRepo } from "./functionality/commit_analysis";
import { Server } from "http";
import { ConfigurationManager } from "../../settings";
import { DefaultData } from "./ai/defaultdata";

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
      // cache for subsequent style comment
      lastAnalysis = analysis;
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
    console.log(
      "[/style-comment] Request received at",
      new Date().toISOString()
    );

    try {
      console.log(
        "[/style-comment] lastAnalysis length:",
        lastAnalysis?.length
      );

      if (!lastAnalysis || lastAnalysis.length === 0) {
        console.warn("[/style-comment] No prior analysis in memory.");
        return res
          .status(409)
          .json({ error: "No prior analysis in memory. Run analyze first." });
      }

      console.log("[/style-comment] Building violation stats...");
      const { stats, avg, anyBelow3, total } =
        buildViolationStats(lastAnalysis);

      console.log(
        "[/style-comment] Stats built:",
        JSON.stringify(stats, null, 2)
      );
      console.log("[/style-comment] Avg grade:", avg);
      console.log("[/style-comment] Any below 3?:", anyBelow3);
      console.log("[/style-comment] Total commits:", total);

      // If average >= 4.5 AND none below 3, skip Gemini and return fixed praise
      if (total > 0 && avg >= 4.5 && !anyBelow3) {
        console.log(
          "[/style-comment] Commits exceptionally good -> skipping Gemini."
        );
        return res.json({
          styleComment:
            "The commit messages analyzed are exceptionally good. We have found no notable commitment issues.",
          stats,
        });
      }

      console.log("[/style-comment] Calling Gemini with stats...");
      const comment = await (
        generativeAIModel as Gemini
      ).generateStyleFeedbackFromStats(stats, ConfigurationManager.user);

      console.log("[/style-comment] Gemini response:", comment);

      return res.json({ styleComment: comment, stats });
    } catch (error: any) {
      console.error("[/style-comment] ERROR:", error);
      return res.status(500).json({ error: error.message || String(error) });
    }
  });

  let lastAnalysis: GradedCommitDisplay[] | null = null;

  // helper to compute rule stats + grade summary from analysis
  function buildViolationStats(analysis: GradedCommitDisplay[]) {
    console.log("[buildViolationStats] Start");
    const total = analysis.length;
    const counts = new Map<number, number>();
    let sum = 0;
    let anyBelow3 = false;

    for (const a of analysis) {
      console.log(
        "[buildViolationStats] Commit:",
        a.commit.commitHash,
        "grade:",
        a.gradedCommit.grade
      );
      sum += a.gradedCommit.grade;
      if (a.gradedCommit.grade < 3) anyBelow3 = true;
      for (const v of a.gradedCommit.violations) {
        console.log("[buildViolationStats] Violation found:", v.rule);
        counts.set(v.rule, (counts.get(v.rule) ?? 0) + 1);
      }
    }

    const stats = Array.from(counts.entries())
      .map(([rule, count]) => {
        const name = DefaultData.rules.get(rule) || `Rule ${rule}`;
        console.log(
          `[buildViolationStats] Rule ${rule} "${name}": ${count}/${total}`
        );
        return { rule, name, count, total };
      })
      .sort((a, b) => a.rule - b.rule);

    const avg = total ? sum / total : 0;
    console.log(
      "[buildViolationStats] Final avg:",
      avg,
      "anyBelow3:",
      anyBelow3,
      "total:",
      total
    );

    return { stats, avg, anyBelow3, total };
  }

  return server;
}

function isValid(val: string | undefined): boolean {
  return !!val && !val.includes("<");
}

export { backend };
