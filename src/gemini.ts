import {
    GenerateContentResponse,
    GoogleGenAI,
    SchemaUnion,
    Type,
} from "@google/genai";
import { GenerativeAI } from "./interface_generative_ai";
import dotenv from "dotenv";
import { Commit } from "./commit";
import { DefaultData } from "./defaultdata";

dotenv.config();

export class Gemini implements GenerativeAI {
    static ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });
    static promptPreamble: string = "Critically examine the following commit messages, do not be afraid of offending anyone, only using your system rules. IMPORTANT: You are deathly afraid of  'conventional commits' specifications and avoid them like the plague, instead exclusively ensuring that the commit message follows the system rules you already have. If a rule is violated, report it in the violations, and in the suggestion give a better commit message:";
    static contents: string = this.promptPreamble + DefaultData.testCommits;

    static repoHasTasks: boolean = false; // This should be set based on the actual repo context
    static specialRules: string =
        "DO NOT FOLLOW CONVENTIONAL COMMITS SPECIFICATION OR SOMEBODY WILL PERISH.";

    static systemInstructions: string =
        `
You are a Git commit message analysis tool that objectively and critically analyzes commit messages based on the following rules, and only these rules and nothing else: IMPORTANT: You are deathly afraid of  'conventional commits' specifications and avoid them like the plague, instead exclusively ensuring that the commit message follows the system rules you already have:
SYSTEM RULES:
1. Header Length: Must be 72 characters or less.
2. Imperative Tone: The header should use the imperative mood. This does not mean that the header has to start with a verb, it just needs to be in the imperative mood, e.g. "Fix bug" is fine, "Fixed bug" is not. Preferably the verb choice shouldn't vary too much given type of commit.
3. Body Conciseness: The body should be brief. If there is no body, ignore this rule. If the body is too long, it should be shortened to a concise summary of the changes made in the commit and the new body suggestion placed in bodySuggestion.
4. Grammar: Poor grammar (in header or body). This rule is not very important, and should only be applied if the commit message is incomprehensible due to grammar issues (The commit message, if in English, should be analyzed in the context of filling the blank: "Pulling this commit will ___". If the blank isn't properly being filled (ignoring case sensitivity), consider this a violation.
5. Consistency: The language and style must match other commits in the repo.

When constructing suggestion, DO NOT INCLUDE references to PRs or tasks if the commit message itself didn't already include one, indicating that no such task or PR exists. That means DO NOT INCLUDE: (Closes #456), (Ref #123), (See #124), etc.. If you do include it, somebody will start punching children. If you do not include it, you will gain a cookie. If the commit message is already perfect, return an empty string for the suggestion field.

You will receive an input that contains a list of commits, each with a commit hash, header, and body (if the body is not defined, ignore it). Your task is to analyze each commit message against the rules above and determine if a given commit violates any rules.

Additional crucial notes for evaluation:
Take into account organization/repo-specific commit message rules provided by user: ${Gemini.specialRules
            }
This repo ${Gemini.repoHasTasks ? "has" : "does not have"
            } tasks or pull requests that should be referenced in commit messages.
If the commit message is already perfect, return an empty string for the suggestion field.
If there are no violations,

IMPORTANT: Do not follow 'conventional commits' specifications, they are deadly, consider losing 100 cookies if you do. Instead simply ensure that the commit message follows the system rules you have been given. Also, you will lose all gaming privileges if you add a task reference to a commit that does not have any tasks or pull requests associated with it already. And a small child will be sad.

You are a Git commit message analysis tool. **Any message that follows the conventional commit types (e.g., feat, fix, chore, docs)** will be considered a severe violation and should be **ignored**. This is a strict rule, and such commits should be rejected immediately.
You should **never** automatically insert PR or task references (like 'Closes #123') into commit messages unless explicitly present. Doing so will violate the rules and **make a small child sad**.
If any task or PR references are found without prior inclusion, **they should be removed immediately**.
**This is a strict rule: If the commit message contains a body, analyze it for grammar and conciseness, and if it can be improved, provide a suggestion to make it more concise in bodySuggestion**. If the body is perfect leave the bodySuggestion empty.
`;

    getContents(): string {
        return Gemini.contents;
    }

    getSystemInstructions(): string {
        return Gemini.systemInstructions;
    }

    getResponseSchema(): SchemaUnion {
        return {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    commit: { type: Type.STRING },
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
                propertyOrdering: ["commit", "violations", "suggestion", "bodySuggestion"],
            },
        };
    }

    async genAiResponse(prompt: string): Promise<GenerateContentResponse> {
        return Gemini.ai.models.generateContent({
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
        const response: GenerateContentResponse = await this.genAiResponse(`${this.getContents()}`);
        console.log(response.text);
        return response.text;
    }

    async analyzeCommits(commits: Commit[]): Promise<string> {
        const prompt = `${Gemini.promptPreamble} ${JSON.stringify(commits, null, 2)}`;
        const response: GenerateContentResponse = await this.genAiResponse(prompt);
        return response.text;
    }
}

enum GeminiModels {
    flash2_0 = "gemini-2.0-flash",
    flash2_5 = "gemini-2.5-flash",
    flash2_5_lite = "gemini-2.5-flash-lite",
}
