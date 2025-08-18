# Which rules constrain a good commit message?

The following rules are the result of analyzing various takes on what constitutes a good commit message from sources we considered had a fair say in the matter.

1. Header length: Must be 72 characters or less.
2. Imperative tone: The header should use the imperative and start with a verb.
3. Body conciseness: The body should not be unnecessarily long. Including extra details is fine, but it should be concise and to the point.
4. Grammar: Use proper grammar (in message header and body). Commits should be comprehensible and follow basic grammar rules.
5. Consistency: The language and style of a given commit must match that of other commits in the repo.

Additionally, if possible, reference the issue or pull request your commit applies to in the commit message.

# Run the extension

Open 'commitment-issues-extension' folder in VSCode and run F5 from 'extension.ts' file to open Extension Development Host window, from which you can configure the extension with API keys and then test its commands.

# Run the backend (previously)

```
npm install
npm test
```

You can then access the basic web interface to make sure it's working properly at: http://localhost:3066/

# Gemini

Commitment Issues makes use of the Gemini API via NodeJS (using TypeScript). We do not process any of your data, but Gemini does.

## Gemini API key

Add a `.env` file with the `GOOGLE_API_KEY=` value.

You can get your own free API key [from Google's AI studio](https://aistudio.google.com/app/apikey).

# Fetching commit messages from any public repository

## GitHub API Token

1. Go to [GitHub Developer Settings](https://github.com/settings/tokens) → Personal access tokens → Fine-grained tokens
2. Click Generate new token
3. Choose token name and leave the rest as default (Public repositories)
4. Copy the token and put it in your `.env` (`GITHUB_TOKEN=`)

## Testing the endpoints

Enter http://localhost:3066/fetch-commits?repoUrl= with the chosen public repository URL and it will display last X commit messages (hash, header, body) in JSON format (currently limited to 20 messages).

Enter http://localhost:3066/analyze-commits?repoUrl= with the chosen public repository URL and it will display LLM suggestions for the last X commits.
