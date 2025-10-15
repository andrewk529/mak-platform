// src/components/Portfolio.jsx
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { formatEth, formatNumber, formatPercent } from '../utils/formatters';
import ClaimRevenue from './ClaimRevenue';

const Portfolio = ({ contracts, account }) => {
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalValue, setTotalValue] = useState(ethers.BigNumber.from(0));
  const [totalIncome, setTotalIncome] = useState(ethers.BigNumber.from(0));
  const [selectedProperty, setSelectedProperty] = useState(null);

  useEffect(() => {
    const fetchPortfolio = async () => {
      if (!contracts.propertyToken || !account) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Get property count
        const count = await contracts.propertyToken.propertyCount();
        const portfolioItems = [];
        let valueSum = ethers.BigNumber.from(0);
        let incomeSum = ethers.BigNumber.from(0);

        // Check balance for each property
        for (let i = 1; i <= count.toNumber(); i++) {
          const balance = await contracts.propertyToken.balanceOf(account, i);

          if (balance.gt(0)) {
            // User owns shares of this property
            const info = await contracts.propertyToken.getPropertyInfo(i);
            
            // Get claimable revenue
            let claimable = ethers.BigNumber.from(0);
            if (contracts.revenueDistribution) {
              try {
                claimable = await contracts.revenueDistribution.getClaimableRevenue(
                  account,
                  i
                );
              } catch (err) {
                console.log('No revenue data for property', i);
              }
            }

            // Get monthly income from oracle
            let monthlyIncome = ethers.BigNumber.from(0);
            if (contracts.propertyOracle) {
              try {
                const rentalData = await contracts.propertyOracle.getRentalIncome(i);
                monthlyIncome = rentalData.monthlyIncome;
              } catch (err) {
                console.log('No oracle data for property', i);
              }
            }

            const shareValue = info.pricePerShare.mul(balance);
            const ownership = (balance.toNumber() / info.totalShares.toNumber()) * 100;
            const userMonthlyIncome = monthlyIncome
              .mul(balance)
              .div(info.totalShares);

            portfolioItems.push({
              id: i,
              name: `Property #${i}`,
              shares: balance.toNumber(),
              totalShares: info.totalShares.toNumber(),
              pricePerShare: info.pricePerShare,
              shareValue,
              ownership,
              claimable,
              monthlyIncome: userMonthlyIncome,
            });

            valueSum = valueSum.add(shareValue);
            incomeSum = incomeSum.add(userMonthlyIncome);
          }
        }

        setPortfolio(portfolioItems);
        setTotalValue(valueSum);
        setTotalIncome(incomeSum);
      } catch (err) {
        console.error('Error fetching portfolio:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolio();
  }, [contracts, account]);

  if (!account) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
        <div className="text-5xl mb-4">🔐</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Connect Your Wallet
        </h3>
        <p className="text-gray-600">
          Please connect your wallet to view your portfolio
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="spinner"></div>
      </div>
    );
  }

  if (portfolio.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No Investments Yet
        </h3>
        <p className="text-gray-600 mb-6">
          Start building your real estate portfolio by purchasing property shares
        </p>
        
          href="/"
          className="inline-block px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors"
        >
          Browse Properties
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl p-6 text-white">
          <div className="text-sm opacity-90 mb-2">Total Portfolio Value</div>
          <div className="text-3xl font-bold">{formatEth(totalValue, 4)} ETH</div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-xl p-6 text-white">
          <div className="text-sm opacity-90 mb-2">Monthly Income</div>
          <div className="text-3xl font-bold">{formatEth(totalIncome, 4)} ETH</div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl p-6 text-white">
          <div className="text-sm opacity-90 mb-2">Properties Owned</div>
          <div className="text-3xl font-bold">{portfolio.length}</div>
        </div>
      </div>

      {/* Portfolio Items */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Your Properties</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {portfolio.map((item) => (
            <div key={item.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {item.name}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-xs text-gray-500">Shares Owned</div>
                      <div className="text-sm font-semibold">
                        {formatNumber(item.shares)} / {formatNumber(item.totalShares)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Ownership</div>
                      <div className="text-sm font-semibold">
                        {formatPercent(item.ownership, 2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Share Value</div>
                      <div className="text-sm font-semibold text-primary-600">
                        {formatEth(item.shareValue, 4)} ETH
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Monthly Income</div>
                      <div className="text-sm font-semibold text-green-600">
                        {formatEth(item.monthlyIncome, 4)} ETH
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 md:mt-0 md:ml-6">
                  {item.claimable.gt(0) ? (
                    <button
                      onClick={() => setSelectedProperty(item)}
                      className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
                    >
                      Claim {formatEth(item.claimable, 4)} ETH
                    </button>
                  ) : (
                    <div className="text-sm text-gray-500">No revenue to claim</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Claim Revenue Modal */}
      {selectedProperty && (
        <ClaimRevenue
          property={selectedProperty}
          contracts={contracts}
          account={account}
          onClose={() => setSelectedProperty(null)}
          onSuccess={() => {
            setSelectedProperty(null);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
};

export default Portfolio;
