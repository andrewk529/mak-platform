// src/hooks/useWeb3.js
// Custom hook for Web3 provider management

import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import {
  getProvider,
  requestAccounts,
  getCurrentAccount,
  getChainId,
  switchNetwork,
  getBalance,
  isMetaMaskInstalled,
  onAccountsChanged,
  onChainChanged,
  removeListeners,
} from '../utils/web3';

export const useWeb3 = () => {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [balance, setBalance] = useState('0');
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  // Initialize provider
  useEffect(() => {
    if (isMetaMaskInstalled()) {
      const web3Provider = getProvider();
      setProvider(web3Provider);
    }
  }, []);

  // Load current account and network
  const loadWeb3Data = useCallback(async () => {
    try {
      const currentAccount = await getCurrentAccount();
      const currentChainId = await getChainId();
      
      if (currentAccount) {
        setAccount(currentAccount);
        const accountBalance = await getBalance(currentAccount);
        setBalance(accountBalance);
      }
      
      if (currentChainId) {
        setChainId(currentChainId);
      }

      if (provider && currentAccount) {
        const web3Signer = provider.getSigner();
        setSigner(web3Signer);
      }
    } catch (err) {
      console.error('Error loading Web3 data:', err);
      setError(err.message);
    }
  }, [provider]);

  // Connect wallet
  const connect = useCallback(async () => {
    if (!isMetaMaskInstalled()) {
      setError('Please install MetaMask to use this app');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const connectedAccount = await requestAccounts();
      const currentChainId = await getChainId();
      const accountBalance = await getBalance(connectedAccount);

      setAccount(connectedAccount);
      setChainId(currentChainId);
      setBalance(accountBalance);

      if (provider) {
        const web3Signer = provider.getSigner();
        setSigner(web3Signer);
      }
    } catch (err) {
      console.error('Error connecting wallet:', err);
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  }, [provider]);

  // Disconnect wallet
  const disconnect = useCallback(() => {
    setAccount(null);
    setBalance('0');
    setSigner(null);
    setError(null);
  }, []);

  // Switch to specific network
  const changeNetwork = useCallback(async (targetChainId) => {
    try {
      await switchNetwork(targetChainId);
      setChainId(targetChainId);
      return true;
    } catch (err) {
      console.error('Error switching network:', err);
      setError(err.message);
      return false;
    }
  }, []);

  // Setup event listeners
  useEffect(() => {
    if (!isMetaMaskInstalled()) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        disconnect();
      } else if (accounts[0] !== account) {
        setAccount(accounts[0]);
        getBalance(accounts[0]).then(setBalance);
      }
    };

    const handleChainChanged = (newChainId) => {
      setChainId(parseInt(newChainId, 16));
      window.location.reload(); // Recommended by MetaMask
    };

    onAccountsChanged(handleAccountsChanged);
    onChainChanged(handleChainChanged);

    return () => {
      removeListeners();
    };
  }, [account, disconnect]);

  // Load data on mount
  useEffect(() => {
    if (provider) {
      loadWeb3Data();
    }
  }, [provider, loadWeb3Data]);

  return {
    account,
    chainId,
    balance,
    provider,
    signer,
    isConnecting,
    isConnected: !!account,
    error,
    connect,
    disconnect,
    changeNetwork,
    isMetaMaskInstalled: isMetaMaskInstalled(),
  };
};
