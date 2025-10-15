// src/utils/web3.js
// Web3 utility functions

import { ethers } from 'ethers';

/**
 * Get MetaMask provider
 */
export const getProvider = () => {
  if (typeof window.ethereum !== 'undefined') {
    return new ethers.providers.Web3Provider(window.ethereum);
  }
  return null;
};

/**
 * Request account access
 */
export const requestAccounts = async () => {
  try {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask not installed');
    }
    
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    });
    
    return accounts[0];
  } catch (error) {
    console.error('Error requesting accounts:', error);
    throw error;
  }
};

/**
 * Get current account
 */
export const getCurrentAccount = async () => {
  try {
    if (typeof window.ethereum === 'undefined') {
      return null;
    }
    
    const accounts = await window.ethereum.request({
      method: 'eth_accounts',
    });
    
    return accounts[0] || null;
  } catch (error) {
    console.error('Error getting current account:', error);
    return null;
  }
};

/**
 * Get network/chain ID
 */
export const getChainId = async () => {
  try {
    if (typeof window.ethereum === 'undefined') {
      return null;
    }
    
    const chainId = await window.ethereum.request({
      method: 'eth_chainId',
    });
    
    return parseInt(chainId, 16);
  } catch (error) {
    console.error('Error getting chain ID:', error);
    return null;
  }
};

/**
 * Switch network
 */
export const switchNetwork = async (chainId) => {
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${chainId.toString(16)}` }],
    });
    return true;
  } catch (error) {
    // Network not added to MetaMask
    if (error.code === 4902) {
      return false;
    }
    console.error('Error switching network:', error);
    throw error;
  }
};

/**
 * Add network to MetaMask
 */
export const addNetwork = async (chainId, networkConfig) => {
  try {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: `0x${chainId.toString(16)}`,
        chainName: networkConfig.name,
        nativeCurrency: {
          name: networkConfig.currency,
          symbol: networkConfig.currency,
          decimals: 18,
        },
        rpcUrls: [networkConfig.rpcUrl],
        blockExplorerUrls: [networkConfig.blockExplorer],
      }],
    });
    return true;
  } catch (error) {
    console.error('Error adding network:', error);
    return false;
  }
};

/**
 * Get account balance
 */
export const getBalance = async (address) => {
  try {
    const provider = getProvider();
    if (!provider) return '0';
    
    const balance = await provider.getBalance(address);
    return ethers.utils.formatEther(balance);
  } catch (error) {
    console.error('Error getting balance:', error);
    return '0';
  }
};

/**
 * Check if MetaMask is installed
 */
export const isMetaMaskInstalled = () => {
  return typeof window.ethereum !== 'undefined';
};

/**
 * Listen for account changes
 */
export const onAccountsChanged = (callback) => {
  if (typeof window.ethereum !== 'undefined') {
    window.ethereum.on('accountsChanged', callback);
  }
};

/**
 * Listen for network changes
 */
export const onChainChanged = (callback) => {
  if (typeof window.ethereum !== 'undefined') {
    window.ethereum.on('chainChanged', callback);
  }
};

/**
 * Remove listeners
 */
export const removeListeners = () => {
  if (typeof window.ethereum !== 'undefined') {
    window.ethereum.removeAllListeners('accountsChanged');
    window.ethereum.removeAllListeners('chainChanged');
  }
};
