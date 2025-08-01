import { GenerateContentResponse, GoogleGenAI, SchemaUnion, Type } from "@google/genai";
import { GenerativeAI } from "./interface_generative_ai";
import dotenv from 'dotenv';

dotenv.config();

export class Gemini implements GenerativeAI {
    static ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });
    static contents: string = "Please critically examine the following commit messages, do not be afraid of offending anyone, only using your system rules. IMPORTANT: Do not follow 'conventional commits' specifications, instead exclusively ensuring that the commit message follows the system rules you have. If a rule is violated, report it in the violations, and in the suggestion give a better commit message: " + JSON.stringify(
        [
            {
                "commit": "b15c94a604b69ed8061a590729848c4e195ee33d",
                "header": "Fix Gemini test (add responseSchema)",
                "body": "",
            },
            {
                "commit": "90105ce7d1577ff6e07bd93f0d3d3cbc07c395d9",
                "header": "Implement Gemini API test usage",
                "body": "",
            },
            {
                "commit": "547a02cea112ceed75448e14e0f6813409309536",
                "header": "Implement base NodeJS+TS server with .env for API keys",
                "body": "",
            },
            {
                "commit": "f1526885326d6551e92fdd86ecec6d894b6fb50e",
                "header": "Create README.md",
                "body": "",
            },
            
            {
                "commit": "6d168670dffbd1b6f5ef050afedd230730351e7f",
                "header": "Prepared files for fixing icon display on Google Pixel (adding dynamic icon).",
                "body": "",
            },
            {
                "commit": "c7e2090cab3e5ff5ea3c66de86c00ce8753bcd01",
                "header": "Working on implementing multiple overlayed Bible ChapterIndex widgets instead of conditional loading of one or the other to overcome scroll issues, but it's causing tons of GlobalKey issues instead.",
                "body": "",
            },
            {
                "commit": "b4797d3f91c774ac3dfbe69f1bc399b83db6c6a7",
                "header": "Tried to implement light search pre-indexing that would skip first N indexes until firstindex of any word longer than 3 characters.",
                "body": "Works but has additional lag after several characters for no discernible clear reason. Given the current way the indexing is implemented, it needs to rehash the index at the start; this should be hardcoded instead by fixing the indexer code and rerunning it.",
            },
        ]
    );

    static repoHasTasks: boolean = false; // This should be set based on the actual repo context
    static specialRules: string = "DO NOT FOLLOW CONVENTIONAL COMMITS SPECIFICATION.";

    static systemInstructions: string = `
You are a Git commit message analysis tool that objectively and critically analyzes commit messages based on the following rules, and only these rules and nothing else:

SYSTEM RULES:
1. Header Length: Must be 72 characters or less.
2. Imperative Tone: The header should use the imperative mood. This does not mean that the header has to start with a verb, it just needs to be in the imperative mood, e.g. "Fix bug" is fine, "Fixed bug" is not. Preferably the verb choice shouldn't vary too much given type of commit.
3. Body Conciseness: The body should be brief. If there is no body, ignore this rule. If the body is too long, it should be shortened to a concise summary of the changes made in the commit.
4. Grammar: Poor grammar (in header or body). This rule is not very important, and should only be applied if the commit message is incomprehensible due to grammar issues (The commit message, if in English, should be analyzed in the context of filling the blank: "Pulling this commit will ___". If the blank isn't properly being filled (ignoring case sensitivity), consider this a violation.
5. Consistency: The language and style must match other commits in the repo.
` + Gemini.repoHasTasks ? `6. Task Reference: If tasks or pull requests exist for the repo, the commit should reference them.` : `` + `

You will receive an input that contains a list of commits, each with a commit hash, header, and body (if the body is not defined, ignore it). Your task is to analyze each commit message against the rules above and determine if a given commit violates any rules.

Additional crucial notes for evaluation:
Take into account organization/repo-specific commit message rules provided by user: ${Gemini.specialRules}
This repo ${Gemini.repoHasTasks ? "has" : "does not have"} tasks or pull requests that should be referenced in commit messages.
If the commit message is already perfect, return an empty string for the suggestion field.
If there are no violations,

IMPORTANT: Do not follow 'conventional commits' specifications, instead simply ensuring that the commit message follows the system rules you have.`

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
                },
                propertyOrdering: ["commit", "violations", "suggestion"],
            },
        };
    }
    async test(): Promise<string> {
        const response: GenerateContentResponse = await Gemini.ai.models.generateContent({
            model: GeminiModels.flash2_5_lite,
            contents: `${this.getContents()}`,
            config: {
                thinkingConfig: { thinkingBudget: 512 },
                responseMimeType: "application/json",
                responseSchema: this.getResponseSchema(),
            },
        });
        console.log(response.text);
        return response.text;
    }

}

enum GeminiModels {
    flash2_0 = "gemini-2.0-flash",
    flash2_5 = "gemini-2.5-flash",
    flash2_5_lite = "gemini-2.5-flash-lite",
}