// src/components/BuyModal.jsx
import React, { useState } from 'react';
import { ethers } from 'ethers';
import { formatEth, formatNumber, parseEth } from '../utils/formatters';

const BuyModal = ({ property, contracts, account, onClose, onSuccess }) => {
  const [shares, setShares] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [txHash, setTxHash] = useState(null);

  const availableShares = property.totalShares - property.mintedShares;
  const totalCost = property.pricePerShare.mul(shares);
  const platformFee = totalCost.mul(250).div(10000); // 2.5% fee
  const totalWithFee = totalCost.add(platformFee);

  const handleSharesChange = (e) => {
    const value = parseInt(e.target.value) || 0;
    if (value > availableShares) {
      setShares(availableShares);
    } else if (value < 1) {
      setShares(1);
    } else {
      setShares(value);
    }
  };

  const handleBuy = async () => {
    if (!contracts.propertyToken || !account) {
      setError('Please connect your wallet');
      return;
    }

    if (shares < 1 || shares > availableShares) {
      setError('Invalid number of shares');
      return;
    }

    setLoading(true);
    setError(null);
    setTxHash(null);

    try {
      // Call mintShares function
      const tx = await contracts.propertyToken.mintShares(
        property.id,
        account,
        shares,
        {
          value: totalWithFee,
          gasLimit: 300000,
        }
      );

      setTxHash(tx.hash);

      // Wait for transaction confirmation
      await tx.wait();

      // Success!
      alert('Purchase successful! 🎉');
      onSuccess();
    } catch (err) {
      console.error('Purchase error:', err);
      
      if (err.code === 'ACTION_REJECTED') {
        setError('Transaction rejected by user');
      } else if (err.code === 'INSUFFICIENT_FUNDS') {
        setError('Insufficient funds for transaction');
      } else {
        setError(err.message || 'Transaction failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 animate-fadeIn">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Buy Shares</h2>
            <p className="text-sm text-gray-500 mt-1">{property.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
            disabled={loading}
          >
            ×
          </button>
        </div>

        {/* Property Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-gray-600">Price per Share</span>
            <span className="text-sm font-semibold">
              {formatEth(property.pricePerShare, 4)} ETH
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Available Shares</span>
            <span className="text-sm font-semibold">
              {formatNumber(availableShares)}
            </span>
          </div>
        </div>

        {/* Shares Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Shares
          </label>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShares(Math.max(1, shares - 1))}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold"
              disabled={loading || shares <= 1}
            >
              -
            </button>
            <input
              type="number"
              value={shares}
              onChange={handleSharesChange}
              min="1"
              max={availableShares}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-center text-lg font-semibold focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={loading}
            />
            <button
              onClick={() => setShares(Math.min(availableShares, shares + 1))}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold"
              disabled={loading || shares >= availableShares}
            >
              +
            </button>
          </div>
          <div className="flex justify-between mt-2">
            <button
              onClick={() => setShares(10)}
              className="text-xs text-primary-600 hover:text-primary-700"
              disabled={loading || availableShares < 10}
            >
              10 shares
            </button>
            <button
              onClick={() => setShares(availableShares)}
              className="text-xs text-primary-600 hover:text-primary-700"
              disabled={loading}
            >
              Max ({availableShares})
            </button>
          </div>
        </div>

        {/* Cost Breakdown */}
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-gray-600">Subtotal</span>
            <span className="text-sm font-medium">
              {formatEth(totalCost, 6)} ETH
            </span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-sm text-gray-600">Platform Fee (2.5%)</span>
            <span className="text-sm font-medium">
              {formatEth(platformFee, 6)} ETH
            </span>
          </div>
          <div className="border-t border-primary-300 pt-2 mt-2">
            <div className="flex justify-between">
              <span className="text-base font-semibold text-gray-900">Total</span>
              <span className="text-base font-bold text-primary-600">
                {formatEth(totalWithFee, 6)} ETH
              </span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Transaction Hash */}
        {txHash && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-blue-600">
              Transaction submitted! Hash: {txHash.slice(0, 10)}...
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleBuy}
            disabled={loading || shares < 1 || shares > availableShares}
            className="flex-1 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Processing...
              </span>
            ) : (
              'Confirm Purchase'
            )}
          </button>
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-gray-500 text-center mt-4">
          By purchasing, you agree to the platform terms and conditions
        </p>
      </div>
    </div>
  );
};

export default BuyModal;
