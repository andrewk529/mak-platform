// src/components/Navbar.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { formatAddress, formatEth } from '../utils/formatters';

const Navbar = ({ account, balance, isConnecting, onConnect, onDisconnect, chainId }) => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  const getNetworkName = (id) => {
    const networks = {
      1: 'Ethereum',
      11155111: 'Sepolia',
      31337: 'Localhost',
    };
    return networks[id] || 'Unknown';
  };

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
              <span className="text-white text-xl font-bold">M</span>
            </div>
            <span className="text-xl font-bold text-gray-900">MAK Platform</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className={`${
                isActive('/')
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-600 hover:text-primary-600'
              } pb-1 transition-colors`}
            >
              Properties
            </Link>
            <Link
              to="/portfolio"
              className={`${
                isActive('/portfolio')
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-600 hover:text-primary-600'
              } pb-1 transition-colors`}
            >
              Portfolio
            </Link>
            <Link
              to="/marketplace"
              className={`${
                isActive('/marketplace')
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-600 hover:text-primary-600'
              } pb-1 transition-colors`}
            >
              Marketplace
            </Link>
          </div>

          {/* Wallet Connection */}
          <div className="flex items-center space-x-4">
            {chainId && (
              <div className="hidden sm:flex items-center px-3 py-1 bg-gray-100 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-700">{getNetworkName(chainId)}</span>
              </div>
            )}

            {account ? (
              <div className="flex items-center space-x-3">
                <div className="hidden sm:block text-right">
                  <div className="text-sm text-gray-500">Balance</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {formatEth(balance, 4)} ETH
                  </div>
                </div>
                <button
                  onClick={onDisconnect}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">{formatAddress(account)}</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onConnect}
                disabled={isConnecting}
                className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-gray-200">
        <div className="flex justify-around py-2">
          <Link
            to="/"
            className={`${
              isActive('/') ? 'text-primary-600' : 'text-gray-600'
            } text-sm font-medium`}
          >
            Properties
          </Link>
          <Link
            to="/portfolio"
            className={`${
              isActive('/portfolio') ? 'text-primary-600' : 'text-gray-600'
            } text-sm font-medium`}
          >
            Portfolio
          </Link>
          <Link
            to="/marketplace"
            className={`${
              isActive('/marketplace') ? 'text-primary-600' : 'text-gray-600'
            } text-sm font-medium`}
          >
            Marketplace
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
