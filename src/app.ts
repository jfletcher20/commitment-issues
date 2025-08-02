import express from "express";
import dotenv from "dotenv";
import { Gemini } from "./gemini";
import { GenerativeAI } from "./interface_generative_ai";
import { GradedCommit } from "./graded_commit";
import { GradedCommitDisplay } from "./graded_commit_display";
import { fetchCommitMessages } from "./github_api";
import { analyzeCommitsFromRepo } from "./commit_analysis";

dotenv.config();
const apiKey = process.env.GOOGLE_API_KEY;
const githubToken = process.env.GITHUB_TOKEN;

const app = express();
const port = 3066;
const fulladdress = `http://localhost:${port}`;
const generativeAIModel: GenerativeAI = new Gemini();

app.listen(port, () => {
  return console.log(`Express is listening at http://localhost:${port}`);
});

app.get("/test", async (req, res) => {
  try {
    const response: string = await generativeAIModel.test();
    console.log("AI Response:", response);
    // the response is a JSON string; should parse the objects into GradedCommit objects and return their HTML representations
    const gradedCommits = JSON.parse(response);
    const htmlResponses = gradedCommits.map((commit: GradedCommit) => {
      const display = new GradedCommitDisplay(commit);
      return display.getHTML();
    });
    res.json(htmlResponses.join("<br>"));
  } catch (error) {
    console.error("Error in /test route:", error);
    res.status(500).json({ error: "Failed to fetch AI response." });
  }
});

app.use("/images", express.static("images"));

// default testing route
app.get("/", (req, res) => {
  res.send(`
  <body style="background-color:#222; color:white; font-family: sans-serif;">
    <div style="display: flex; justify-content: center; align-items: center; height: 90vh; flex-direction: column;">
      <img src="${fulladdress}/images/icon.png" alt="Logo" style="width: 300px; height: auto; margin-bottom: 20px;">
      <p style="color: #888;">Make sure to set your <code>GOOGLE_API_KEY</code> environment variable.</p>

      <div style="position: relative; display: inline-block;">

<pre style="overflow-y: auto; white-space: pre-wrap; word-wrap: break-word; width: 600px; height: 200px; margin-top: 20px; padding: 10px; font-family: Consolas, monospace; background-color: #333; color: #ddd; border: none; border-radius: 5px;" id="ai-response">
Instructions: <span style="color: #0ff;">${generativeAIModel.getContents()}</span></pre>

        <form action="/test" method="post" style="position: absolute; left: 40%; right: 40%; bottom: -15px; margin: 0;">
           <style>
            .styled-button {
              padding: 10px 20px;
              font-size: 16px;
              background-color: #444;
              color: white;
              border: none;
              border-radius: 5px;
              cursor: pointer;
            }
            .styled-button:hover {
              background-color: #555;
            }
            .styled-button:active {
              background-color: #222;
            }
            .styled-button:focus {
              background-color: #444;
            }
          </style>
          <button type="submit" class="styled-button">Generate Content</button>
        </form>
      </div>
      <script>
        document.querySelector('form').addEventListener('submit', function(event) {
          event.preventDefault();
          fetch('/test', { method: 'GET' })
            .then(response => {
              if (!response.ok) throw new Error('Network response was not ok');
              return response.json();
            })
            .then(data => {
              console.log('AI Response:', data);
              document.getElementById('html-response').innerHTML = data;
            })
            .catch(error => {
              console.error('Error:', error);
              console.log('AI Response:', data);
              document.getElementById('html-response').innerText = 'Error fetching AI response.';
            });
        });
      </script>
      <div id="html-response" style="margin-top: 20px; width: 600px; max-height: 400px; overflow-y: auto;"></div>
      </div>
  </body>
  `);
});

app.get("/fetch-commits", async (req, res) => {
  const repoUrl = req.query.repoUrl as string;

  if (!repoUrl) {
    return res.status(400).json({ error: "Missing repoUrl parameter" });
  }
  if (!githubToken) {
    return res
      .status(500)
      .json({ error: "GitHub token not set in environment variables" });
  }

  try {
    const commitMessages = await fetchCommitMessages(repoUrl, githubToken);
    res.json({ commits: commitMessages });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/analyze-commits", async (req, res) => {
  const repoUrl = req.query.repoUrl as string;

  if (!repoUrl) {
    return res.status(400).json({ error: "Missing repoUrl parameter" });
  }
  if (!githubToken) {
    return res
      .status(500)
      .json({ error: "GitHub token not set in environment variables" });
  }

  try {
    const html = await analyzeCommitsFromRepo(
      repoUrl,
      githubToken,
      generativeAIModel
    );
    res.send(html);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
