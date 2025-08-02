# Run the project

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
