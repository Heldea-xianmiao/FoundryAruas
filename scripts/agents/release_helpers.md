Release helpers

This folder contains helper scripts and curl examples to manage GitHub repo metadata and releases.

1) Set repository description & topics (requires `GITHUB_TOKEN` env):

```bash
curl -H "Authorization: token $GITHUB_TOKEN" \
  -X PATCH \
  -d '{"name":"FoundryAruas","description":"Foundry Auras - WeakAuras-style visual editor for Foundry VTT","homepage":"","private":false}' \
  https://api.github.com/repos/Heldea-xianmiao/FoundryAruas

# Set topics (replace array as needed)
curl -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.mercy-preview+json" \
  -X PUT \
  -d '{"names":["foundryvtt","foundry-module","weak-auras","visual-editor"]}' \
  https://api.github.com/repos/Heldea-xianmiao/FoundryAruas/topics
```

2) Create a GitHub Release via API (requires `GITHUB_TOKEN`):

```bash
# Create release tag and push tag locally first (already done by script)
# Then create GitHub release
curl -H "Authorization: token $GITHUB_TOKEN" \
  -d '{"tag_name":"v0.1.1","target_commitish":"master","name":"v0.1.1","body":"Initial release with CI and agent tooling.","draft":false,"prerelease":false}' \
  https://api.github.com/repos/Heldea-xianmiao/FoundryAruas/releases
```

3) Automated script (optional): `scripts/agents/bump_version_and_tag.js` will be added to help bump version, commit, tag and push. Run it locally to bump patch version automatically.
