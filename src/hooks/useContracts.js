// src/hooks/useContracts.js
// Custom hook for smart contract interactions

import { useState, useEffect, useMemo } from 'react';
import { ethers } from 'ethers';
import { ABIS, getContractAddresses } from '../config/contracts';

export const useContracts = (provider, signer, chainId) => {
  const [contracts, setContracts] = useState({});
  const [loading, setLoading] = useState(true);

  // Get contract addresses for current network
  const addresses = useMemo(() => {
    return chainId ? getContractAddresses(chainId) : {};
  }, [chainId]);

  // Initialize contracts
  useEffect(() => {
    if (!provider || !chainId) {
      setLoading(false);
      return;
    }

    try {
      const contractInstances = {};

      // PropertyToken contract
      if (addresses.PropertyToken && addresses.PropertyToken !== '0x...') {
        contractInstances.propertyToken = new ethers.Contract(
          addresses.PropertyToken,
          ABIS.PropertyToken,
          signer || provider
        );
      }

      // PropertyMarketplace contract
      if (addresses.PropertyMarketplace && addresses.PropertyMarketplace !== '0x...') {
        contractInstances.marketplace = new ethers.Contract(
          addresses.PropertyMarketplace,
          ABIS.PropertyMarketplace,
          signer || provider
        );
      }

      // RevenueDistribution contract
      if (addresses.RevenueDistribution && addresses.RevenueDistribution !== '0x...') {
        contractInstances.revenueDistribution = new ethers.Contract(
          addresses.RevenueDistribution,
          ABIS.RevenueDistribution,
          signer || provider
        );
      }

      // PropertyOracle contract
      if (addresses.PropertyOracle && addresses.PropertyOracle !== '0x...') {
        contractInstances.propertyOracle = new ethers.Contract(
          addresses.PropertyOracle,
          ABIS.PropertyOracle,
          signer || provider
        );
      }

      setContracts(contractInstances);
      setLoading(false);
    } catch (error) {
      console.error('Error initializing contracts:', error);
      setLoading(false);
    }
  }, [provider, signer, chainId, addresses]);

  return {
    contracts,
    addresses,
    loading,
    isReady: Object.keys(contracts).length > 0,
  };
};
