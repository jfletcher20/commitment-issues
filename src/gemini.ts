import { GenerateContentResponse, GoogleGenAI, SchemaUnion, Type } from "@google/genai";
import { GenerativeAI } from "./interface_generative_ai";
import dotenv from 'dotenv';

dotenv.config();

export class Gemini implements GenerativeAI {
    static ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });
    static contents: string = "Please critically examine the following commit messages, do not be afraid of offending anyone, only using your 7 system rules. If a rule is violated, report it in the violations along with the penalty incurred, and in the suggestion give a better commit message: " + JSON.stringify(
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
    static specialRules: string = "No special rules, proceed according to system prompt.";

    static systemInstructions: string = `
You are a Git commit message analysis tool that rates commit messages on a scale of 5 to 0, where 5 is "excellent" and 0 is "extremely poor." The score starts at 5 and decreases based on rule violations. The rating is based on the following criteria (and ONLY those criteria):

1. Header Length: Must be 72 characters or less. Exceeding this reduces the score by -1.
2. Imperative Tone: The header should use the imperative mood. If not, reduce by -0.5.
3. Body Conciseness: The body should be brief. If it's too long, reduce by -0.5.
4. Grammar: Poor grammar (in header or body) reduces the score by -1.
` + Gemini.repoHasTasks ? `5. Task Reference: If tasks or pull requests exist for the repo, the commit should reference them. Missing reference reduces the score by -1.` : `5. Ignore rule 5 because repo does not have tasks or pull requests defined` + `
6. Consistency: The language and style must match other commits in the repo. Inconsistent style reduces the score by -0.5 or -1.
7. Score below 3: Commits with a score below 3 are considered unsatisfactory.

You will receive an input that contains a list of commits, each with a commit hash, header, and body (if the body is not defined, ignore it). Your task is to analyze each commit message against the rules above and assign a score from 0 to 5.

You will justify the grade by listing which rules were violated and provide a revised commit message addressing these issues.

For each commit message analyzed, you will output a JSON object according to the defined schema. The properties of the JSON object are as follows:

Fields:
- "commit": The commit hash that the critique applies to.
- "violations": An array of objects where each object has two properties: "rule" (integer, index of the violated rule number) and "penalty" (the penalty applied).
- "grade": The final grade from 0-5 after applying all penalties; fixed to 1 decimal point (e.g., 4.5).
- "suggestion": If there are violations, an improved commit message. Otherwise, leave it as an empty string "".

Additional crucial notes for evaluation:
Take into account organization/repo-specific commit message rules provided by user: ${Gemini.specialRules}
This repo ${Gemini.repoHasTasks ? "has" : "does not have"} tasks or pull requests that should be referenced in commit messages.
If the commit message is already perfect, return an empty string for the suggestion field.
`

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
                            properties: {
                                rule: { type: Type.NUMBER, },
                                penalty: { type: Type.NUMBER, },
                            },
                        },
                    },
                    grade: { type: Type.NUMBER, },
                    suggestion: { type: Type.STRING, },
                },
                propertyOrdering: ["commit", "violations", "grade", "suggestion"],
            },
        };
    }

    async test(): Promise<string> {
        const response: GenerateContentResponse = await Gemini.ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: `${this.getContents()}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: this.getResponseSchema(),
            },
        });
        console.log(response.text);
        return response.text;
    }

}