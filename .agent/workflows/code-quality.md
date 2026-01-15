---
description: Run code quality checks (lint, format, type-check, test)
---

# Code Quality Checks

Run all code quality validation before commits.

## Full Check (Recommended before commits)

// turbo

1. Run TypeScript type checking:

```bash
npm run type-check
```

// turbo 2. Run ESLint to check for issues:

```bash
npm run lint
```

// turbo 3. Run tests:

```bash
npm test
```

## Auto-Fix Issues

// turbo

- Fix linting issues automatically:

```bash
npm run lint:fix
```

// turbo

- Format all code with Prettier:

```bash
npm run format
```

## Notes

- Pre-commit hooks (Husky) will run lint-staged automatically
- Always run type-check before pushing - strict mode is enabled
- ESLint warns on inline styles - prefer StyleSheet
