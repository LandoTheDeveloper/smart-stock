# 🤝 Contributing to Smart Stock

Welcome to Smart Stock!  
This guide will walk you through how to use Git and GitHub the right way

---

## Step 1: Clone the Project

1. Make sure Git and Node.js are installed.
2. Open your terminal and run:
   - `git clone https://github.com/LandoTheDeveloper/smart-stock.git`
   - `cd smart-stock`

---

## Step 2: Create a Branch

Never code directly on main.  
Create a new branch for each change.
`checkout` is how you move between branches or create new ones
`checkout -b` creates a new branch and moves to it in one command

Example commands:
- `git checkout main`  Go to the main branch
- `git pull origin main`  Get the latest version
- `git checkout -b feature/login-page`  Create a new branch

Name your branch something clear, like:
- `feature/add-recipe-form`
- `fix/typo-in-navbar`

---

## Step 3: Make and Commit Changes

After editing files:
- `git add .`
- `git commit -m "feat: add recipe form"`

**Tips for commit messages:**
- Start with a short prefix:
  - feat → new feature
  - fix → bug fix
  - docs → documentation
  - style → code formatting
- Example: `fix: crash when scanning receipts`

---

## Step 4: Push and Create a Pull Request (PR)

1. Push your branch to GitHub:
   - `git push origin feature/login-page`

2. Go to the repo on GitHub. You’ll see:
   **“Compare & pull request”**

3. Click it and fill in:
   - Title (short summary)
   - Description (what you changed and why)
   - Add reviewers (your teammates)

---

## Step 5: Review and Merge

1. Wait for at least one teammate to review.
2. If changes are requested, fix them and push again.
3. Once approved, click **Merge Pull Request**.
4. Update your main branch:
   - `git checkout main`
   - `git pull origin main`

---

## Step 6: Delete Your Old Branch

After merging:
- `git branch -d feature/login-page`
- `git push origin --delete feature/login-page`

---

## Helpful Commands

| Action | Command |
|--------|----------|
| Check your current branch | git branch |
| Pull latest main changes | git pull origin main |
| See what changed | git status |
| Switch branches | git checkout branch-name |
| Undo last commit (soft) | git reset --soft HEAD~1 |

---

## Team Tips

- Always pull main before starting new work.
- Keep PRs small and focused (1 feature or fix).
- If someone else edits the same file, talk first to avoid conflicts.
- Ask for help — we’re all learning!

---

🎉 That’s it!  
You now know how to clone → branch → code → push → open a PR → merge.  
Welcome to the team ❤️
