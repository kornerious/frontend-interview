#!/bin/bash

echo "🔒 Creating a clean commit with only the latest changes..."

# First, let's commit any pending changes
git add src/utils/gistStorageService.ts
git commit -m "Fix code warnings in gistStorageService.ts"

# Create .env.example if it doesn't exist
if [ ! -f .env.example ]; then
  echo "# Environment variables - DO NOT COMMIT REAL VALUES
NEXT_PUBLIC_GITHUB_GIST_TOKEN=your_token_here
NEXT_PUBLIC_GIST_ID=your_gist_id_here
NEXT_PUBLIC_GIST_FILENAME=FrontendDevInterview.json
NEXT_PUBLIC_CLAUDE_API_KEY=your_claude_key_here" > .env.example
  git add .env.example
  git commit -m "Add .env.example with placeholder values"
fi

# Create a new orphan branch (no history)
git checkout --orphan temp-clean-branch

# Add all files from the current state
git add .

# Remove any sensitive files that might still be there
git rm -f --cached .env .env.local .env.development .env.test .env.production 2>/dev/null

# Commit the current state
git commit -m "Clean repository state"

# Rename the branch to main
git branch -D main 2>/dev/null
git branch -m main

echo "✅ Created clean branch with no history"
echo ""
echo "To push to GitHub, run:"
echo "git push -f origin main"
echo ""
echo "Or create a new GitHub repository and push to it:"
echo "git remote add origin https://github.com/username/repo.git"
echo "git push -f origin main"
