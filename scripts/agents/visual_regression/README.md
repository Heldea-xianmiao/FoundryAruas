Visual Regression Testing - Skeleton

Purpose

This folder contains a lightweight skeleton for visual regression testing for the `FoundryAuras` module. It is intentionally minimal so you can integrate it into CI when ready.

Approach

1. Use a headless browser (Puppeteer) to load a controlled Foundry instance or a saved local HTML fixture of the module UI.
2. Capture screenshots of target UI states (manager panel, editor, HUD preview).
3. Compare screenshots against approved baselines using `pixelmatch` or `resemblejs`.
4. Fail when pixel diffs exceed a configurable threshold.

Files

- `run_visual_regression_stub.js`: a runnable stub that outlines commands to capture screenshots and compare; useful as a starting point.

Quick start (local stub)

```bash
# Run the stub (it only prints instructions and exits)
node scripts/agents/visual_regression/run_visual_regression_stub.js
```

CI integration notes

- Prefer running visual tests in a dedicated runner with Xvfb (Linux) or headless Chrome in containers.
- Store baseline images under `tests/visual/baselines/` and generated screenshots under `tests/visual/current/`.
- Upload failing screenshots as artifacts for debugging.

Recommended npm packages (optional):
- `puppeteer`
- `pixelmatch`
- `pngjs`
- `resemblejs`

If you want, I can scaffold a full Puppeteer-based flow and create baseline sample screenshots under `tests/visual/`.
