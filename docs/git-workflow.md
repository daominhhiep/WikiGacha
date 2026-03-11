# Git Workflow

This document defines the Git workflow used in the Wikigacha project to ensure a consistent and organized development process.

---

# Branch Strategy

The project follows a **feature-based branching model**.

Main branches:

```
main
develop
```

### main
- Production-ready code
- Always stable
- Only merged from `develop` through reviewed pull requests

### develop
- Integration branch for ongoing development
- All feature branches are merged into this branch

---

# Branch Naming Convention

All branches must follow the naming format:

```
type/short-description
```

Branch types:

```
feature/<feature-name>
fix/<bug-name>
chore/<task-name>
refactor/<refactor-name>
test/<test-name>
docs/<documentation-name>
```

Examples:

```
feature/gacha-system
feature/deck-builder
fix/battle-calculation
chore/update-dependencies
docs/update-api-docs
```

---

# Development Workflow

### 1. Create a Feature Branch

Always create a branch from `develop`.

```
git checkout develop
git pull origin develop
git checkout -b feature/gacha-system
```

---

### 2. Implement the Feature

During development:

- Follow project coding conventions
- Write unit tests
- Keep commits small and meaningful

---

### 3. Commit Changes

Commit messages should follow the **Conventional Commits** format.

```
type: short description
```

Types:

```
feat
fix
chore
refactor
docs
test
```

Examples:

```
feat: implement gacha pack system
fix: resolve deck validation bug
refactor: simplify battle logic
docs: update project overview
```

---

### 4. Push Branch to Remote

```
git push origin feature/gacha-system
```

---

### 5. Create Pull Request

Create a Pull Request from:

```
feature branch → develop
```

Pull request requirements:

- Code review required
- All tests must pass
- No merge conflicts

---

### 6. Merge to Develop

After approval:

- Squash or merge commits
- Delete the feature branch

---

# Release Workflow

When a new release is ready:

1. Create a release branch

```
release/v1.0.0
```

2. Perform final fixes and testing

3. Merge into `main`

```
release/v1.0.0 → main
```

4. Tag the release

```
git tag v1.0.0
git push origin v1.0.0
```

5. Merge release changes back to `develop`

---

# Hotfix Workflow

For urgent production issues:

1. Create hotfix branch from `main`

```
hotfix/battle-bug
```

2. Implement the fix

3. Merge into:

```
main
develop
```

4. Tag a patch release

```
v1.0.1
```

---

# Commit Best Practices

Good commits:

- Small and focused
- Clear description
- One logical change per commit

Example:

```
feat: add deck validation rules
```

Avoid:

```
fix stuff
update code
misc changes
```

---

# Pull Request Guidelines

Each PR should include:

- Clear title
- Description of changes
- Related issue or task
- Screenshots (for frontend changes)

Example template:
```
# Description

Implement gacha pack system

# Changes

Add gacha module

Implement pack opening logic

Add unit tests

# Testing

All tests passed locally
```

---

# Git Best Practices

- Pull latest changes before starting work
- Rebase feature branches if needed
- Resolve conflicts locally before pushing
- Never commit `.env` files
- Keep commit history clean