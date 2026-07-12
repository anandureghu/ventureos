# /cwds — Commit With Description Standard

Read and follow `~/.cursor/skills/cwds/SKILL.md` exactly.

Commit all relevant changes now using **Conventional Commits** with a **required body** (description). **Never** add `Co-authored-by` or any co-author trailer.

## Execute now

1. Run in parallel: `git status`, `git diff`, `git diff --staged`, `git log -3 --oneline`
2. Stage relevant files (never `.env`, secrets, or credentials)
3. Draft: `type(scope): imperative subject` + blank line + body explaining **why**
4. Commit via HEREDOC — single `-m` block only, no trailers
5. Verify: `git status` and `git log -1 --format=full` — confirm no `Co-authored-by`

If the user added text after `/cwds`, use it as the commit intent. Otherwise derive from the diff.

Do not push unless explicitly asked.
