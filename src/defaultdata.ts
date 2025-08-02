abstract class DefaultData {
    static rules: Map<number, string> = new Map([
        [1, "Header Length: Must be 72 characters or less."],
        [2, "Imperative Tone: The header should use the imperative and start with a verb"],
        [3, "Body Conciseness: The body should not be unnecessarily long. Including extra details is fine, but it should be concise and to the point."],
        [4, "Grammar: Use proper grammar (in header or body). Commits should be comprehensible and follow basic grammar rules."],
        [5, "Consistency: The language and style of a given commit must match that of other commits in the repo."],
    ]);
    static testCommits: string = JSON.stringify([
        {
            commit: "b15c94a604b69ed8061a590729848c4e195ee33d",
            header: "Fix Gemini test (add responseSchema)",
            body: "",
        },
        {
            commit: "90105ce7d1577ff6e07bd93f0d3d3cbc07c395d9",
            header: "Implement Gemini API test usage",
            body: "",
        },
        {
            commit: "547a02cea112ceed75448e14e0f6813409309536",
            header: "Implement base NodeJS+TS server with .env for API keys",
            body: "",
        },
        {
            commit: "f1526885326d6551e92fdd86ecec6d894b6fb50e",
            header: "Create README.md",
            body: "",
        },

        {
            commit: "6d168670dffbd1b6f5ef050afedd230730351e7f",
            header:
                "Prepared files for fixing icon display on Google Pixel (adding dynamic icon).",
            body: "",
        },
        {
            commit: "c7e2090cab3e5ff5ea3c66de86c00ce8753bcd01",
            header:
                "Working on implementing multiple overlayed Bible ChapterIndex widgets instead of conditional loading of one or the other to overcome scroll issues, but it's causing tons of GlobalKey issues instead.",
            body: "",
        },
        {
            commit: "b4797d3f91c774ac3dfbe69f1bc399b83db6c6a7",
            header:
                "Tried to implement light search pre-indexing that would skip first N indexes until firstindex of any word longer than 3 characters.",
            body: "Works but has additional lag after several characters for no discernible clear reason. Given the current way the indexing is implemented, it needs to rehash the index at the start; this should be hardcoded instead by fixing the indexer code and rerunning it.",
        },
    ]);
}

export { DefaultData };
