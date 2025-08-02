# Run the project

```
npm install
npm test
```

# Gemini Testing

Testing out usage of Gemini API via NodeJS (using TypeScript).

See screenshot below for how file structure should look.
<img width="274" height="530" alt="image" src="https://github.com/user-attachments/assets/3492eeba-528c-4ce1-afd3-1242d0f4c583" />

# Fetching commit messages from any public repository

## GitHub API Token

1. Go to [GitHub Developer Settings](https://github.com/settings/tokens) → Personal access tokens → Fine-grained tokens
2. Click Generate new token
3. Choose token name and leave the rest as default (Public repositories)
4. Copy the token and put it in your .env (GITHUB_TOKEN=)

## Testing the endpoint

Enter http://localhost:3066/fetch-commits?repoUrl= with the chosen public repository URL and it will display last X commit messages in JSON format (currently limited to 20 messages).
