# Badge Setup for MAK Platform README

Add these badges to the top of your main README.md file (right after the title):

```markdown
# MAK Platform 🏡

> **Revolutionizing Real Estate Through Blockchain Technology & AI**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/andrewk529/mak-platform/actions/workflows/ci.yml/badge.svg)](https://github.com/andrewk529/mak-platform/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/andrewk529/mak-platform/branch/main/graph/badge.svg?token=YOUR_CODECOV_TOKEN)](https://codecov.io/gh/andrewk529/mak-platform)
[![Test Coverage](https://img.shields.io/badge/coverage-95%25-brightgreen)](https://codecov.io/gh/andrewk529/mak-platform)
[![Tests](https://img.shields.io/badge/tests-passing-success)](https://github.com/andrewk529/mak-platform/actions)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-blue.svg)](https://soliditylang.org/)
[![Hardhat](https://img.shields.io/badge/Framework-Hardhat-yellow.svg)](https://hardhat.org/)
[![Security](https://img.shields.io/badge/Security-Audited-green)](docs/audits/)
```

## Badge Explanations

### 1. License Badge
```markdown
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
```
- Shows your project license
- No setup needed
- Update if you change licenses

### 2. CI/CD Badge
```markdown
[![CI](https://github.com/andrewk529/mak-platform/actions/workflows/ci.yml/badge.svg)](https://github.com/andrewk529/mak-platform/actions/workflows/ci.yml)
```
- Shows build status (passing/failing)
- Automatically works after pushing `.github/workflows/ci.yml`
- Updates in real-time

### 3. Codecov Coverage Badge
```markdown
[![codecov](https://codecov.io/gh/andrewk529/mak-platform/branch/main/graph/badge.svg?token=YOUR_TOKEN)](https://codecov.io/gh/andrewk529/mak-platform)
```
**Setup Required:**
1. Sign up at [codecov.io](https://codecov.io/)
2. Add your repository
3. Get your upload token from Settings
4. Add `CODECOV_TOKEN` to GitHub Secrets
5. Replace `YOUR_TOKEN` in badge URL with badge token from Codecov Settings → Badge

### 4. Custom Coverage Badge
```markdown
[![Test Coverage](https://img.shields.io/badge/coverage-95%25-brightgreen)](https://codecov.io/gh/andrewk529/mak-platform)
```
- Manual badge showing coverage percentage
- Update the `95%25` part with your actual coverage
- Use URL encoding: % becomes %25
- Colors:
  - `brightgreen` for 90%+
  - `green` for 80-89%
  - `yellow` for 70-79%
  - `orange` for 60-69%
  - `red` for <60%

### 5. Tests Badge
```markdown
[![Tests](https://img.shields.io/badge/tests-passing-success)](https://github.com/andrewk529/mak-platform/actions)
```
- Shows test status
- Update manually or automate with GitHub Actions

### 6. Technology Badges
```markdown
[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-blue.svg)](https://soliditylang.org/)
[![Hardhat](https://img.shields.io/badge/Framework-Hardhat-yellow.svg)](https://hardhat.org/)
```
- Shows tech stack
- Update version numbers as needed

### 7. Security Badge
```markdown
[![Security](https://img.shields.io/badge/Security-Audited-green)](docs/audits/)
```
- Shows security status
- Options:
  - `Audited` (green) - Professional audit complete
  - `In Review` (yellow) - Audit in progress
  - `Pending` (orange) - No audit yet

## Quick Setup Checklist

- [ ] Copy `.github/workflows/ci.yml` to your repo
- [ ] Copy `package.json` with test scripts
- [ ] Copy `hardhat.config.js` with coverage config
- [ ] Copy `.solcover.js` configuration
- [ ] Sign up for Codecov account
- [ ] Add `CODECOV_TOKEN` to GitHub Secrets
- [ ] Push all files to GitHub
- [ ] Wait for first CI/CD run to complete
- [ ] Copy badge URLs to README.md
- [ ] Update coverage percentage in custom badge
- [ ] Celebrate! 🎉

## Dynamic Badge Updates

For automatically updating badges, use Codecov's dynamic badges:

```markdown
<!-- This badge updates automatically -->
[![codecov](https://codecov.io/gh/andrewk529/mak-platform/branch/main/graph/badge.svg)](https://codecov.io/gh/andrewk529/mak-platform)
```

## Alternative: Shields.io Dynamic Badges

You can also use Shields.io to create dynamic badges from GitHub Actions:

```markdown
<!-- CI Status from GitHub Actions -->
![CI](https://img.shields.io/github/actions/workflow/status/andrewk529/mak-platform/ci.yml?branch=main&label=tests)

<!-- Coverage from Codecov -->
![Coverage](https://img.shields.io/codecov/c/github/andrewk529/mak-platform)

<!-- Last commit -->
![Last Commit](https://img.shields.io/github/last-commit/andrewk529/mak-platform)

<!-- Contributors -->
![Contributors](https://img.shields.io/github/contributors/andrewk529/mak-platform)

<!-- Issues -->
![Issues](https://img.shields.io/github/issues/andrewk529/mak-platform)

<!-- Stars -->
![Stars](https://img.shields.io/github/stars/andrewk529/mak-platform?style=social)
```

## Custom Badge Colors

Customize badge colors using shields.io:

```markdown
<!-- Custom color coverage badge -->
![Coverage](https://img.shields.io/badge/coverage-95%25-success?style=flat-square&logo=codecov)

<!-- Different styles -->
![Flat](https://img.shields.io/badge/style-flat-blue?style=flat)
![Flat Square](https://img.shields.io/badge/style-flat--square-blue?style=flat-square)
![Plastic](https://img.shields.io/badge/style-plastic-blue?style=plastic)
![For the Badge](https://img.shields.io/badge/style-for--the--badge-blue?style=for-the-badge)
```

## Recommended Badge Layout

Place badges in logical groups:

```markdown
# MAK Platform 🏡

<!-- License & Build Status -->
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![CI](https://github.com/andrewk529/mak-platform/actions/workflows/ci.yml/badge.svg)](https://github.com/andrewk529/mak-platform/actions)

<!-- Code Quality -->
[![codecov](https://codecov.io/gh/andrewk529/mak-platform/branch/main/graph/badge.svg)](https://codecov.io/gh/andrewk529/mak-platform)
[![Code Quality](https://img.shields.io/codeclimate/maintainability/andrewk529/mak-platform)](https://codeclimate.com/github/andrewk529/mak-platform)

<!-- Technology Stack -->
[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-blue.svg)](https://soliditylang.org/)
[![Hardhat](https://img.shields.io/badge/Framework-Hardhat-yellow.svg)](https://hardhat.org/)
[![Node](https://img.shields.io/badge/Node-%3E%3D18.0.0-green)](https://nodejs.org/)

<!-- Security & Compliance -->
[![Security](https://img.shields.io/badge/Security-Audited-green)](docs/audits/)
[![OpenZeppelin](https://img.shields.io/badge/Security-OpenZeppelin-blue)](https://openzeppelin.com/)
```

## Badge Troubleshooting

### Badge shows "unknown" or "invalid"
- Check repository is public
- Verify GitHub Actions workflow has run at least once
- Ensure Codecov has received coverage data

### Coverage badge not updating
- Check CODECOV_TOKEN is correct in GitHub Secrets
- Verify coverage files are generated before upload
- Look at GitHub Actions logs for upload errors

### CI badge shows failing but tests pass locally
- Check Node.js versions match (local vs CI)
- Verify all dependencies are in package.json
- Review GitHub Actions logs for specific errors

## Next Steps

After adding badges:

1. Run `npm test` to ensure tests pass
2. Run `npm run coverage` to generate initial coverage
3. Push changes to trigger CI/CD
4. Check GitHub Actions to verify workflow runs
5. Visit Codecov to confirm coverage upload
6. Update badge URLs in README with actual values

---

For detailed setup instructions, see [TESTING.md](TESTING.md)
