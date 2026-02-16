# GitHub Wiki Publish Guide

## Purpose
This project stores wiki source pages under `docs/wiki/`.  
This guide defines manual publishing to GitHub Wiki repositories.

## Prerequisites
- GitHub repository exists and wiki is enabled.
- You have push access to `<owner>/<repo>.wiki.git`.
- Local source pages are up to date in `docs/wiki/`.

## Canonical Local Source
- `docs/wiki/Home.md`
- `docs/wiki/_Sidebar.md`
- All other pages in `docs/wiki/*.md`

## GitHub Wiki Naming Convention
- Keep filename and page title aligned in kebab or title style.
- Use stable names to avoid broken links.
- Keep `_Sidebar.md` as the navigation source for wiki sidebar.

Recommended wiki page names:
- `Home`
- `Architecture-Overview`
- `Domain-Model-and-Data-Lifecycle`
- `Database-and-Repositories`
- `Screen-Flows-and-UX-States`
- `Location-Maps-and-Places-Integration`
- `Ranking-Engine-and-Decision-Logic`
- `State-I18n-and-Platform-Variants`
- `Developer-Rules-and-Engineering-Standards`
- `Testing-QA-and-Regression-Checklist`
- `Release-Runbook-and-Troubleshooting`
- `Contributing-Workflow`
- `Glossary`

## Manual Publish Workflow
From a temporary directory:
```bash
git clone https://github.com/<owner>/<repo>.wiki.git
cd <repo>.wiki
```

Copy project wiki pages into the wiki clone:
```bash
cp -R /Users/ejunpark/Development/react\ native/price\ record/docs/wiki/*.md .
```

Review and publish:
```bash
git status
git add .
git commit -m "Update project wiki documentation"
git push
```

## Pre-Publish Checklist
- [ ] All planned pages exist in `docs/wiki/`.
- [ ] `Home.md` links are valid.
- [ ] `_Sidebar.md` links are valid.
- [ ] No references rely on excluded design-spec docs.
- [ ] Architecture/rules reflect current code behavior.
- [ ] Manual checks and tests referenced are current.

## Post-Publish Checklist
- [ ] Open wiki Home page and validate major links.
- [ ] Confirm sidebar renders expected hierarchy.
- [ ] Spot-check Mermaid blocks render correctly in GitHub Wiki.

## Maintenance Cadence
- Update wiki in same PR for architecture, repository, ranking, or platform behavior changes.
- Review this publish guide if repository ownership or wiki URL changes.

## Related Pages
- [Home](./Home.md)
- [Contributing Workflow](./Contributing-Workflow.md)
- [Developer Rules and Engineering Standards](./Developer-Rules-and-Engineering-Standards.md)
