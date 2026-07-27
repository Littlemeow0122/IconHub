# Custom Agent Rules & Skills

## Git Shortcuts & Workflow

- **When the user says "git push"**:
  - Automatically execute: `git add . && git commit -m "update" && git push origin main`
  - Report the command status and output upon completion.

- **When the user says "git pull"**:
  - Automatically execute: `git pull origin main` (or pull changes from the configured remote repository).
  - Report the status of pulled files.
