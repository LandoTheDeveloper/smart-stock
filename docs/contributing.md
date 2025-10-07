Contributing to Smart Stock


Branching Strategy

main - Production-ready code. Auto-deploys to production
dev - Development/staging branch. Auto-deploys to dev/staging environment
feature/* - Temporary branches for new features (merged to dev, then deleted)

Workflow
1. Start New Work
# Ensure you have latest dev branch
git checkout dev
git pull origin dev

# Create a new feature branch
git checkout -b feature/JIRA-123-short-description


2. Make Changes
# Make your code changes
# Write/update tests
# Ensure tests pass locally

# Commit changes
git add .
git commit -m "JIRA-123: Add user authentication feature"


3. Push Your Branch
# Push to remote
git push -u origin feature/JIRA-123-short-description


4. Create Pull Request

Go to GitHub
Create Pull Request: feature/JIRA-123-... → dev
Fill out PR description:

What changed and why
Link to Jira ticket
How to test
Screenshots (if UI changes)


Request reviewers

5. Code Review

Address feedback from reviewers
Make additional commits if needed
Push changes (PR updates automatically)

6. Merge to Dev

Once approved and CI passes
Merge PR to dev
Delete feature branch
Test in dev/staging environment

7. Deploy to Production
When dev is stable and ready for release:

Create Pull Request: dev → main
Requires team lead approval
Merge to main
Auto-deploys to production

Branch Naming Conventions

feature/JIRA-XXX-description - New features
bugfix/JIRA-XXX-description - Bug fixes
hotfix/JIRA-XXX-description - Urgent production fixes

Examples:
feature/JIRA-456-user-login
bugfix/JIRA-789-fix-memory-leak
hotfix/JIRA-101-security-patch
Hotfix Workflow (Emergency Fixes)

For urgent production issues:
# Branch from main
git checkout main
git pull origin main
git checkout -b hotfix/JIRA-XXX-description

# Make fix, test, and push
git push -u origin hotfix/JIRA-XXX-description

# Create PR to main, get approval, merge

# Then sync back to dev
git checkout dev
git pull origin dev
git merge main
git push origin dev
Pull Request Requirements
Before creating PR:

 Code builds successfully
 All tests pass
 No merge conflicts

PR must include:

Clear title: "JIRA-123: Brief description"
Description of changes
Link to Jira ticket
How to test

Review requirements:

PRs to dev: 1 approval minimum
PRs to main: 2 approvals (or team lead)
All CI checks must pass

Commit Message Guidelines
Format:
JIRA-XXX: Brief description (50 chars or less)

Optional detailed explanation if needed.
Good examples:
JIRA-456: Add user authentication endpoint
JIRA-789: Fix memory leak in database pool
JIRA-101: Update validation logic

Bad examples:
fix bug
updates
WIP
Questions?

Team Lead: Chris Cooper