# Publishing Passiar to GitHub

The full Passiar project is ready to publish to **https://github.com/Passiar/App**.

## Current blocker

The Cursor GitHub integration token in this environment only has access to:

- `EricksonAtHome/ethereum-org`

It **cannot** create or push to `Passiar/App` until:

1. The `Passiar/App` repository exists, and
2. A GitHub token with **Passiar org** access is provided.

## Standalone export branch

The complete project (Backend + Frontend at repo root) is available here:

**https://github.com/EricksonAtHome/ethereum-org/tree/passiar-app-standalone**

## Option A — Publish with a GitHub PAT (recommended)

1. Create an **empty** repository: https://github.com/organizations/Passiar/repositories/new  
   - Name: `App`  
   - Do **not** add README, .gitignore, or license

2. Create a [Personal Access Token](https://github.com/settings/tokens) with `repo` scope for the Passiar org.

3. Run:

```bash
export GITHUB_TOKEN=ghp_your_token_here
chmod +x scripts/publish-to-passiar.sh
./scripts/publish-to-passiar.sh
```

## Option B — Manual push

```bash
git clone --branch passiar-app-standalone \
  https://github.com/EricksonAtHome/ethereum-org.git passiar-temp
cd passiar-temp

git remote add passiar https://github.com/Passiar/App.git
git push -u passiar passiar-app-standalone:main
```

## Option C — Connect Passiar in Cursor Cloud

1. Install the Cursor GitHub App on the **Passiar** organization
2. Create the empty `App` repository
3. Re-run this agent task to push directly

## Project structure

```
App/
├── Backend/     # Node.js + Express + Socket.IO + PostgreSQL
├── Frontend/    # React + Vite + Tailwind
├── docker-compose.yml
└── README.md
```

## Environment setup after clone

```bash
cd Backend && cp .env.example .env   # set DATABASE_URL (Neon)
cd ../Frontend && cp .env.example .env
```
