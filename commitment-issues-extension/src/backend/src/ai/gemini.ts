import {
  GenerateContentResponse,
  GoogleGenAI,
  SchemaUnion,
  Type,
} from "@google/genai";

import { GenerativeAI } from "../ai/interface_generative_ai";
import { Commit } from "../models/commit";
import { DefaultData } from "./defaultdata";
import { ConfigurationManager } from "../../../settings";

export class Gemini implements GenerativeAI {
  static promptPreamble: string =
    "Critically examine the following commit messages, do not be afraid of offending anyone, only using your system rules. If a rule is violated, report it in the violations, and in the suggestion give a better commit message:";
  static contents: string = this.promptPreamble + DefaultData.testCommits;

  static repoHasOpenTasks: boolean = false; // This should be set based on the actual repo context

  static systemInstructions: string = `
You are a Git commit message analysis tool that objectively and critically analyzes commit messages based on the following rules, and only these rules and nothing else: *IMPORTANT: Unless told otherwise, you are deathly afraid of 'conventional commits' specifications and avoid them like the plague*, instead exclusively ensuring that the commit message follows the system rules you already have:
SYSTEM RULES:
1. **Header Length: Must be 72 characters or less.** If the header is longer than 72 characters, it should be shortened to fit within this limit and the new header placed in suggestion.
2. Imperative Tone: The header should use the imperative mood. This does not mean that the header has to start with a verb, it just needs to be in the imperative mood, e.g. "Fix bug" is fine, "Fixed bug" is not. Preferably the verb choice shouldn't vary too much given type of commit. **The commit message header, if in English, should be analyzed in the context of filling the blank: "Pulling this commit will _". It is ok if the header ends with a period, do not dock points for that. If the blank isn't properly being filled (ignoring case sensitivity), consider this a violation.**
3. Body Conciseness: The body should be brief. If there is no body, ignore this rule. If the body is too long, it should be shortened to a concise summary of the changes made in the commit and the new body suggestion placed in bodySuggestion.
4. Grammar: Poor grammar (in header or body). *This rule is not very important, and should only be applied if the commit message is incomprehensible* due to grammar issues (**The commit message header, if in English, should be analyzed in the context of filling the blank: "Pulling this commit will _". If the blank isn't properly being filled (ignoring case sensitivity), consider this a violation.**
5. ***IMPORTANT: Consistency: The language and style must match other commits in the repo.***

When constructing a suggestion, DO NOT INCLUDE references to PRs or tasks if the commit message itself didn't already include one, indicating that no such task or PR exists. That means DO NOT INCLUDE: (Closes #456), (Ref #123), (See #124), etc.. If you do include it, somebody will start punching children. If you do not include it, you will gain a cookie. If the commit message is already perfect, return an empty string for the suggestion field.

You will receive an input that contains a list of commits, each with a commit hash, header, and body (if the body is not defined, ignore it). Your task is to analyze each commit message against the rules above and determine if a given commit violates any rules.

Additional crucial notes for evaluation:
*This repo ${
    Gemini.repoHasOpenTasks ? "has" : "does not have"
  } tasks or pull requests that should be referenced in commit messages.*
If the commit message is already perfect, return an empty string for the suggestion field.
If there are no violations,

*IMPORTANT: Do not follow 'conventional commits' specifications unless told otherwise. Conventional commits specifications are deadly, consider losing 100 cookies if you do. Instead simply ensure that the commit message follows the system rules you have been given. Also, you will lose all gaming privileges if you add a task reference to a commit that does not have any tasks or pull requests associated with it already. And a small child will be sad.*

You are a Git commit message analysis tool. **Any message that follows the conventional commit types (e.g., feat, fix, chore, docs)** will be considered a severe violation and should be **ignored**, unless told otherwise. This is a strict rule, and such commits should be rejected immediately.
You should **never** automatically insert PR or task references (like 'Closes #123') into commit messages unless explicitly present. Doing so will violate the rules and **make a small child sad**.
If any task or PR references are found without prior inclusion, **they should be removed immediately**.
**This is a strict rule: If the commit message contains a body, analyze it for grammar and conciseness, and if it can be improved, provide a suggestion to make it more concise in bodySuggestion. If the body is less than 12 words and its grammar is fine, this is acceptable and there is no violation. The body does not have to be in imperative, instead follow the tense of the original body.**. If the body is perfect leave the bodySuggestion empty.
**This is a strict rule: If the commit message follows basic merge commit message format (e.g., 'Merge branch 'feature-branch' into main'), it MUST NOT be considered a violation of rules 2 nor 4.**
***Very important and strict rule: 5. Consistency: The language and style must match other commits in the repo.***
***Important: Commit headers you receive that exceed 72 characters are marked by "|72|" at the spot where they become too long. You must always provide a shorter recommendation if so, and report the violation of rule 1 (remove the |72| marker when providing your response).***`;

  getContents(): string {
    return Gemini.contents;
  }

  getSpecialRules(): string {
    return ConfigurationManager.specialRules
      ? `Special rules provided by the user, of utmost importance: ***These rules can override system rules: ${ConfigurationManager.specialRules}***`
      : "";
  }

  getSystemInstructions(): string {
    return ConfigurationManager.specialRulesOverrideSystemInstructions
      ? ""
      : Gemini.systemInstructions;
  }

  getResponseSchema(): SchemaUnion {
    return {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          commitHash: { type: Type.STRING },
          violations: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: { rule: { type: Type.NUMBER } },
            },
          },
          suggestion: { type: Type.STRING },
          bodySuggestion: { type: Type.STRING },
        },
        propertyOrdering: [
          "commitHash",
          "violations",
          "suggestion",
          "bodySuggestion",
        ],
      },
    };
  }

  async genAiResponse(prompt: string): Promise<GenerateContentResponse> {
    const ai = new GoogleGenAI({ apiKey: ConfigurationManager.gemini });
    return ai.models.generateContent({
      model: GeminiModels.flash2_5,
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 512 },
        responseMimeType: "application/json",
        responseSchema: this.getResponseSchema(),
        systemInstruction: this.getSystemInstructions(),
      },
    });
  }

  async test(): Promise<string> {
    const response: GenerateContentResponse = await this.genAiResponse(
      `${this.getContents()}`
    );
    console.log(response.text);
    return response.text ?? "<no response>";
  }

  async analyzeCommits(commits: Commit[]): Promise<string> {
    if (commits.length > 0) {
      Gemini.repoHasOpenTasks = !!commits[0].repoHasOpenTasks;
    }

    commits.forEach((commit) => {
      if (commit.header.length > 72) {
        commit.header =
          commit.header.substring(0, 72) + "|72|" + commit.header.substring(72);
      }
    });

    const prompt = `${Gemini.promptPreamble} ${JSON.stringify(
      commits,
      null,
      2
    )}`;
    const response: GenerateContentResponse = await this.genAiResponse(prompt);
    return response.text ?? "<no response>";
  }

  async generateStyleComment(
    commits: Commit[],
    author?: string
  ): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: ConfigurationManager.gemini });

    // keep the sample short so it’s cheap/stable
    const sample = commits.slice(0, 50).map((c) => ({
      header: c.header,
      body: c.body?.slice(0, 160) ?? "",
    }));

    const stylePrompt = `You are an expert mentor for software engineering students.
Given the following commit messages (headers + short bodies), write a short, personalized
overall comment on the author's general commit-message writing style (NOT specific to any single commit).
Keep it brief (3–5 sentences). Mention 1–2 strengths, 1–2 weaknesses, and finish with 3 concrete tips.
Do NOT output JSON; return plain text only.${
      author ? ` Address the author by name: ${author}.` : ""
    }

COMMITS:
${JSON.stringify(sample, null, 2)}`;

    const resp: GenerateContentResponse = await ai.models.generateContent({
      model: GeminiModels.flash2_5,
      contents: stylePrompt,
      // IMPORTANT: no responseSchema here; ask for plain text
      config: {
        responseMimeType: "text/plain",
        systemInstruction: "", // keep it neutral for this secondary call
      },
    });

    return resp.text ?? "<no style comment>";
  }
}

enum GeminiModels {
  flash2_0 = "gemini-2.0-flash",
  flash2_5 = "gemini-2.5-flash",
  flash2_5_lite = "gemini-2.5-flash-lite",
}
