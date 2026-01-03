module.exports = {
  skipFiles: [
    'test/',
    'mocks/',
    'interfaces/',
  ],
  measureStatementCoverage: true,
  measureFunctionCoverage: true,
  measureBranchCoverage: true,
  measureLineCoverage: true,
  providerOptions: {
    mnemonic: "test test test test test test test test test test test junk",
    default_balance_ether: 10000000,
    total_accounts: 20,
  },
  mocha: {
    timeout: 200000,
    grep: "@skip-on-coverage",
    invert: true
  },
  client: require('ganache'),
  istanbulReporter: ['html', 'lcov', 'text', 'json', 'cobertura'],
  silent: false,
  configureYulOptimizer: true,
  solcOptimizerDetails: {
    peephole: false,
    inliner: false,
    jumpdestRemover: false,
    orderLiterals: true,
    deduplicate: false,
    cse: false,
    constantOptimizer: false,
    yul: true
  }
};
