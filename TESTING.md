# Testing & Coverage Guide

> **Complete guide to running tests, generating coverage reports, and setting up CI/CD badges for MAK Platform**

[![CI](https://github.com/andrewk529/mak-platform/actions/workflows/ci.yml/badge.svg)](https://github.com/andrewk529/mak-platform/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/andrewk529/mak-platform/branch/main/graph/badge.svg)](https://codecov.io/gh/andrewk529/mak-platform)
[![Test Coverage](https://api.codeclimate.com/v1/badges/YOUR_TOKEN/test_coverage)](https://codeclimate.com/github/andrewk529/mak-platform/test_coverage)

---

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Running Tests](#-running-tests)
- [Coverage Reports](#-coverage-reports)
- [Setting Up Badges](#-setting-up-badges)
- [CI/CD Integration](#-cicd-integration)
- [Troubleshooting](#-troubleshooting)

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Generate coverage report
npm run coverage

# View coverage in browser
npm run coverage:report
```

---

## 🧪 Running Tests

### **Test Structure**

```
test/
├── unit/                    # Unit tests for individual contracts
│   ├── PropertyToken.test.js
│   ├── Marketplace.test.js
│   └── RevenueDistribution.test.js
├── integration/             # Integration tests for contract interactions
│   ├── EndToEnd.test.js
│   └── CrossContract.test.js
├── security/                # Security-focused tests
│   ├── Reentrancy.test.js
│   ├── AccessControl.test.js
│   └── EdgeCases.test.js
└── helpers/                 # Test utilities
    ├── fixtures.js
    └── utils.js
```

### **Available Test Commands**

```bash
# Run all tests
npm test

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run only security tests
npm run test:security

# Run tests in watch mode (auto-rerun on changes)
npm run test:watch

# Run tests with gas reporting
REPORT_GAS=true npm test
```

### **Test Output Example**

```
  PropertyToken
    Deployment
      ✓ Should deploy with correct initial state (523ms)
      ✓ Should grant DEFAULT_ADMIN_ROLE to deployer (412ms)
    Property Tokenization
      ✓ Should tokenize a new property (1834ms)
      ✓ Should revert if non-minter tries to tokenize property (623ms)
      ✓ Should revert if total shares is zero (456ms)
    ...

  45 passing (12s)
```

---

## 📊 Coverage Reports

### **Generating Coverage**

```bash
# Generate coverage report
npm run coverage

# Open HTML coverage report in browser
npm run coverage:report
```

### **Coverage Output**

```
--------------------|----------|----------|----------|----------|
File                |  % Stmts | % Branch |  % Funcs |  % Lines |
--------------------|----------|----------|----------|----------|
 contracts/         |      100 |      100 |      100 |      100 |
  PropertyToken.sol |      100 |      100 |      100 |      100 |
  Marketplace.sol   |     95.5 |     87.5 |      100 |     96.3 |
  Revenue...sol     |     98.2 |     91.7 |      100 |     98.5 |
--------------------|----------|----------|----------|----------|
All files           |     97.9 |     93.1 |      100 |     98.3 |
--------------------|----------|----------|----------|----------|
```

### **Understanding Coverage Metrics**

- **Statements**: Percentage of code statements executed during tests
- **Branch**: Percentage of conditional branches tested (if/else, switch)
- **Functions**: Percentage of functions called during tests
- **Lines**: Percentage of code lines executed

### **Coverage Goals**

| Contract Type | Target Coverage |
|--------------|-----------------|
| Core Contracts (PropertyToken, Marketplace) | **>95%** |
| Utility Contracts (Oracle, Revenue) | **>90%** |
| Governance Contracts | **>95%** |
| Overall Project | **>90%** |

---

## 🏆 Setting Up Badges

### **1. Codecov Badge (Recommended)**

#### **Step 1: Sign Up for Codecov**

1. Go to [codecov.io](https://codecov.io/)
2. Sign in with GitHub
3. Add your repository

#### **Step 2: Get Codecov Token**

1. Navigate to your repository in Codecov
2. Go to Settings → General
3. Copy the "Repository Upload Token"

#### **Step 3: Add Token to GitHub Secrets**

1. In GitHub, go to: Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Name: `CODECOV_TOKEN`
4. Value: [Paste your Codecov token]
5. Click "Add secret"

#### **Step 4: Add Badge to README**

```markdown
[![codecov](https://codecov.io/gh/andrewk529/mak-platform/branch/main/graph/badge.svg?token=YOUR_TOKEN)](https://codecov.io/gh/andrewk529/mak-platform)
```

Replace:
- `andrewk529/mak-platform` with your GitHub username/repo
- `YOUR_TOKEN` with your Codecov badge token (found in Settings → Badge)

---

### **2. GitHub Actions Badge**

#### **Automatic - No Setup Required!**

The badge is automatically generated once you push the CI workflow.

```markdown
[![CI](https://github.com/andrewk529/mak-platform/actions/workflows/ci.yml/badge.svg)](https://github.com/andrewk529/mak-platform/actions/workflows/ci.yml)
```

---

### **3. Code Climate Badge (Alternative)**

#### **Step 1: Sign Up for Code Climate**

1. Go to [codeclimate.com](https://codeclimate.com/)
2. Sign in with GitHub
3. Add repository

#### **Step 2: Get Test Reporter ID**

1. Go to Repo Settings → Test Coverage
2. Copy "Test Reporter ID"

#### **Step 3: Add to GitHub Secrets**

1. Name: `CC_TEST_REPORTER_ID`
2. Value: [Paste your Code Climate Reporter ID]

#### **Step 4: Add to CI Workflow**

```yaml
# Add to .github/workflows/ci.yml after coverage step
- name: Upload to Code Climate
  uses: paambaati/codeclimate-action@v5.0.0
  env:
    CC_TEST_REPORTER_ID: ${{ secrets.CC_TEST_REPORTER_ID }}
  with:
    coverageLocations: ${{github.workspace}}/coverage/lcov.info:lcov
```

#### **Step 5: Add Badge**

```markdown
[![Test Coverage](https://api.codeclimate.com/v1/badges/YOUR_TOKEN/test_coverage)](https://codeclimate.com/github/andrewk529/mak-platform/test_coverage)
```

---

### **4. Shields.io Custom Badge**

Create custom badges for any metric:

```markdown
![Coverage](https://img.shields.io/badge/coverage-95%25-brightgreen)
![Tests](https://img.shields.io/badge/tests-45%20passing-success)
![Security](https://img.shields.io/badge/security-audited-blue)
```

---

## 🔄 CI/CD Integration

### **GitHub Actions Workflow**

The workflow in `.github/workflows/ci.yml` automatically:

1. ✅ Runs on every push and pull request
2. ✅ Tests on multiple Node.js versions (18.x, 20.x)
3. ✅ Compiles contracts
4. ✅ Runs all tests
5. ✅ Generates coverage reports
6. ✅ Uploads to Codecov
7. ✅ Runs security analysis (Slither, Mythril)
8. ✅ Checks code quality (Solhint, ESLint)
9. ✅ Reports gas usage

### **Viewing CI/CD Results**

1. Go to your GitHub repository
2. Click on "Actions" tab
3. Click on any workflow run to see details
4. View test results, coverage, and artifacts

### **Downloading Coverage Reports**

Coverage reports are saved as artifacts in GitHub Actions:

1. Go to Actions → [Select workflow run]
2. Scroll to "Artifacts" section
3. Download `coverage-report-{node-version}`
4. Extract and open `index.html` in browser

---

## 🔧 Troubleshooting

### **Issue: Tests Failing**

```bash
# Clear cache and reinstall
rm -rf node_modules cache artifacts
npm install

# Recompile contracts
npx hardhat clean
npx hardhat compile

# Run tests again
npm test
```

### **Issue: Coverage Not Generating**

```bash
# Make sure solidity-coverage is installed
npm install --save-dev solidity-coverage

# Check .solcover.js exists
ls -la .solcover.js

# Run with verbose output
npx hardhat coverage --verbose
```

### **Issue: Out of Memory**

```bash
# Increase Node memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
npm run coverage
```

### **Issue: Codecov Upload Failing**

1. Verify `CODECOV_TOKEN` is set in GitHub Secrets
2. Check token has not expired
3. Ensure coverage files are generated before upload:

```bash
# Locally test codecov
npx codecov --file=coverage/coverage-final.json --token=YOUR_TOKEN
```

### **Issue: Slow Test Execution**

```bash
# Enable parallel testing (if tests are independent)
npx hardhat test --parallel

# Run specific test file
npx hardhat test test/unit/PropertyToken.test.js
```

---

## 📈 Coverage Best Practices

### **1. Write Comprehensive Tests**

```javascript
describe("Contract Function", () => {
  it("Should work with valid input", async () => {
    // Happy path
  });

  it("Should revert with invalid input", async () => {
    // Error handling
  });

  it("Should handle edge cases", async () => {
    // Boundary conditions
  });

  it("Should emit correct events", async () => {
    // Event verification
  });
});
```

### **2. Test All Branches**

```javascript
// Test both branches of conditional
if (condition) {
  // Test this path
} else {
  // AND test this path
}
```

### **3. Test Access Control**

```javascript
it("Should allow admin to perform action", async () => {
  // Test authorized access
});

it("Should prevent non-admin from performing action", async () => {
  // Test unauthorized access reverts
});
```

### **4. Test Edge Cases**

- Zero values
- Maximum values
- Empty arrays/strings
- Overflow/underflow scenarios
- Reentrancy attempts

### **5. Use Coverage to Find Gaps**

```bash
# Generate coverage
npm run coverage

# Open HTML report
# Look for red/yellow highlighted code = untested
open coverage/index.html
```

---

## 📊 Coverage Visualization

### **HTML Report**

After running `npm run coverage`, open `coverage/index.html` to see:

- File-by-file breakdown
- Line-by-line highlighting:
  - 🟢 Green = Covered
  - 🟡 Yellow = Partially covered (some branches)
  - 🔴 Red = Not covered
- Function coverage details
- Branch coverage details

### **Terminal Output**

```
--------------------|----------|----------|----------|----------|
File                |  % Stmts | % Branch |  % Funcs |  % Lines |
--------------------|----------|----------|----------|----------|
 PropertyToken.sol  |      100 |      100 |      100 |      100 |
 Marketplace.sol    |     95.5 |     87.5 |      100 |     96.3 |
--------------------|----------|----------|----------|----------|
```

---

## 🎯 Achieving 95%+ Coverage

### **Current Coverage Status**

| Contract | Statements | Branches | Functions | Lines |
|----------|-----------|----------|-----------|-------|
| PropertyToken | 🚧 TBD | 🚧 TBD | 🚧 TBD | 🚧 TBD |
| Marketplace | 🚧 TBD | 🚧 TBD | 🚧 TBD | 🚧 TBD |
| RevenueDistribution | 🚧 TBD | 🚧 TBD | 🚧 TBD | 🚧 TBD |

### **Roadmap to 95%**

1. ✅ Write unit tests for all functions
2. ✅ Test all error conditions
3. ✅ Test all branches (if/else)
4. ✅ Test edge cases and boundary values
5. ✅ Test integration between contracts
6. ✅ Test access control thoroughly
7. ✅ Test pause/unpause functionality
8. ✅ Test event emissions

---

## 🔗 Useful Resources

- **[Hardhat Testing Guide](https://hardhat.org/hardhat-runner/docs/guides/test-contracts)** - Official testing documentation
- **[Solidity Coverage](https://github.com/sc-forks/solidity-coverage)** - Coverage tool documentation
- **[Codecov Documentation](https://docs.codecov.com/)** - Codecov setup guides
- **[GitHub Actions](https://docs.github.com/en/actions)** - CI/CD workflow documentation
- **[OpenZeppelin Test Helpers](https://docs.openzeppelin.com/test-helpers/)** - Testing utilities

---

## 📞 Support

**Issues with Testing?**
- Check [GitHub Issues](https://github.com/andrewk529/mak-platform/issues)
- Review [Troubleshooting](#-troubleshooting) section
- Ask in [GitHub Discussions](https://github.com/andrewk529/mak-platform/discussions)

---

## 📝 Example: Complete Test Flow

```bash
# 1. Install dependencies
npm install

# 2. Compile contracts
npx hardhat compile

# 3. Run tests
npm test

# 4. Generate coverage
npm run coverage

# 5. View coverage report
open coverage/index.html

# 6. Push to GitHub (triggers CI/CD)
git add .
git commit -m "Add comprehensive test coverage"
git push origin main

# 7. Check CI/CD results
# Go to GitHub Actions tab to see workflow run

# 8. View coverage on Codecov
# Visit https://codecov.io/gh/YOUR_USERNAME/YOUR_REPO
```

---

<div align="center">

**✅ Your tests are now automated and tracked!**

Every push will automatically run tests, generate coverage, and update badges.

[← Back to Main README](../README.md) • [View Coverage →](https://codecov.io/gh/andrewk529/mak-platform)

</div>
