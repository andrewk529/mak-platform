// src/utils/formatters.js
// Helper functions for formatting data

import { ethers } from 'ethers';

/**
 * Format ETH value to readable string
 */
export const formatEth = (value, decimals = 4) => {
  if (!value) return '0';
  try {
    return parseFloat(ethers.utils.formatEther(value)).toFixed(decimals);
  } catch (error) {
    console.error('Error formatting ETH:', error);
    return '0';
  }
};

/**
 * Parse ETH value from string
 */
export const parseEth = (value) => {
  try {
    return ethers.utils.parseEther(value.toString());
  } catch (error) {
    console.error('Error parsing ETH:', error);
    return ethers.BigNumber.from(0);
  }
};

/**
 * Format address to short version
 */
export const formatAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

/**
 * Format large numbers with commas
 */
export const formatNumber = (num, decimals = 0) => {
  if (!num) return '0';
  return parseFloat(num).toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/**
 * Format USD value
 */
export const formatUSD = (value) => {
  if (!value) return '$0.00';
  return `$${formatNumber(value, 2)}`;
};

/**
 * Format percentage
 */
export const formatPercent = (value, decimals = 2) => {
  if (!value) return '0%';
  return `${parseFloat(value).toFixed(decimals)}%`;
};

/**
 * Format timestamp to readable date
 */
export const formatDate = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Format time ago
 */
export const formatTimeAgo = (timestamp) => {
  if (!timestamp) return '';
  const seconds = Math.floor(Date.now() / 1000 - timestamp);
  
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
  };
  
  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
    }
  }
  
  return 'just now';
};

/**
 * Calculate APY from monthly income
 */
export const calculateAPY = (monthlyIncome, propertyValue) => {
  if (!monthlyIncome || !propertyValue) return 0;
  const annualIncome = monthlyIncome * 12;
  return (annualIncome / propertyValue) * 100;
};

/**
 * Validate Ethereum address
 */
export const isValidAddress = (address) => {
  try {
    return ethers.utils.isAddress(address);
  } catch {
    return false;
  }
};

/**
 * Copy to clipboard
 */
export const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text);
};

/**
 * Format transaction hash for display
 */
export const formatTxHash = (hash) => {
  if (!hash) return '';
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
};

/**
 * Get explorer URL for transaction
 */
export const getExplorerUrl = (chainId, hash, type = 'tx') => {
  const explorers = {
    1: 'https://etherscan.io',
    11155111: 'https://sepolia.etherscan.io',
    31337: 'http://localhost:8545',
  };
  
  const baseUrl = explorers[chainId] || explorers[11155111];
  return `${baseUrl}/${type}/${hash}`;
};

/**
 * Truncate text with ellipsis
 */
export const truncate = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};

/**
 * Format basis points to percentage
 */
export const basisPointsToPercent = (basisPoints) => {
  return (basisPoints / 100).toFixed(2);
};
