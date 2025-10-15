// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useWeb3 } from './hooks/useWeb3';
import { useContracts } from './hooks/useContracts';
import Navbar from './components/Navbar';
import PropertyList from './components/PropertyList';
import Portfolio from './components/Portfolio';
import Marketplace from './components/Marketplace';

function App() {
  const {
    account,
    chainId,
    balance,
    provider,
    signer,
    isConnecting,
    isConnected,
    error: web3Error,
    connect,
    disconnect,
    isMetaMaskInstalled,
  } = useWeb3();

  const { contracts, addresses, loading: contractsLoading } = useContracts(
    provider,
    signer,
    chainId
  );

  // Show MetaMask installation prompt
  if (!isMetaMaskInstalled) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="text-6xl mb-4">🦊</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            MetaMask Required
          </h1>
          <p className="text-gray-600 mb-6">
            Please install MetaMask to use MAK Platform
          </p>
          
            href="https://metamask.io/download/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors"
          >
            Install MetaMask
          </a>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar
          account={account}
          balance={balance}
          isConnecting={isConnecting}
          onConnect={connect}
          onDisconnect={disconnect}
          chainId={chainId}
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Web3 Error */}
          {web3Error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-600">{web3Error}</p>
            </div>
          )}

          {/* Wrong Network Warning */}
          {chainId && chainId !== 11155111 && chainId !== 31337 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-yellow-800">
                ⚠️ Please switch to Sepolia testnet or localhost
              </p>
            </div>
          )}

          {/* Contracts Not Deployed */}
          {isConnected && !contractsLoading && !contracts.propertyToken && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Contracts Not Deployed
              </h3>
              <p className="text-blue-700 mb-4">
                Smart contracts are not yet deployed to this network. Please deploy
                them first or check your contract addresses in{' '}
                <code className="bg-blue-100 px-2 py-1 rounded">
                  src/config/contracts.js
                </code>
              </p>
              <div className="text-sm text-blue-600">
                <p className="mb-2">To deploy contracts:</p>
                <code className="block bg-blue-100 p-3 rounded">
                  npx hardhat run scripts/deploy.js --network sepolia
                  <br />
                  npx hardhat run scripts/initialize.js --network sepolia
                </code>
              </div>
            </div>
          )}

          {/* Routes */}
          <Routes>
            <Route
              path="/"
              element={
                <div>
                  <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                      Investment Properties
                    </h1>
                    <p className="text-gray-600">
                      Browse and invest in tokenized real estate
                    </p>
                  </div>
                  <PropertyList contracts={contracts} account={account} />
                </div>
              }
            />
            <Route
              path="/portfolio"
              element={
                <div>
                  <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                      My Portfolio
                    </h1>
                    <p className="text-gray-600">
                      View and manage your property investments
                    </p>
                  </div>
                  <Portfolio contracts={contracts} account={account} />
                </div>
              }
            />
            <Route
              path="/marketplace"
              element={
                <div>
                  <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                      Marketplace
                    </h1>
                    <p className="text-gray-600">
                      Trade property shares with other investors
                    </p>
                  </div>
                  <Marketplace />
                </div>
              }
            />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="text-center text-sm text-gray-500">
              <p>© 2025 MAK Platform. Built with ❤️ on Ethereum.</p>
              <p className="mt-2">
                
                  href="https://github.com/andrewk529/mak-platform"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-700"
                >
                  GitHub
                </a>
                {' · '}
                <a href="/docs" className="text-primary-600 hover:text-primary-700">
                  Documentation
                </a>
              </p>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
