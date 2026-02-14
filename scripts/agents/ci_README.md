CI for FoundryAuras

This repository includes a GitHub Actions workflow at `.github/workflows/ci.yml` that runs on push and pull_request to `main`/`master`.

What it runs:

- `node scripts/agents/localization_qa.js` — runs localization QA and produces `scripts/agents/localization_report.json`.
- `node scripts/agents/jquery_scan_only.js` — scans for jQuery-like usages and produces `scripts/agents/jquery_scan_only_report.json`.
- `node scripts/agents/todo_runner.js list` — lists project SPEC todos.

Notes:

- The jQuery scan step is non-destructive.
- The workflow uploads generated reports as artifacts for inspection.
- If you want the workflow to fail on issues, modify the scripts to exit with non-zero codes when problems are found.
