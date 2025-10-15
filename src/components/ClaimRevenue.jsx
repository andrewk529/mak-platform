// src/components/ClaimRevenue.jsx
import React, { useState } from 'react';
import { formatEth } from '../utils/formatters';

const ClaimRevenue = ({ property, contracts, account, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [txHash, setTxHash] = useState(null);

  const handleClaim = async () => {
    if (!contracts.revenueDistribution || !account) {
      setError('Contract not available');
      return;
    }

    setLoading(true);
    setError(null);
    setTxHash(null);

    try {
      const tx = await contracts.revenueDistribution.claimRevenue(property.id, {
        gasLimit: 200000,
      });

      setTxHash(tx.hash);

      await tx.wait();

      alert('Revenue claimed successfully! 🎉');
      onSuccess();
    } catch (err) {
      console.error('Claim error:', err);
      
      if (err.code === 'ACTION_REJECTED') {
        setError('Transaction rejected by user');
      } else {
        setError(err.message || 'Claim failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 animate-fadeIn">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Claim Revenue</h2>
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

        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6 text-center">
          <div className="text-sm text-gray-600 mb-2">Claimable Revenue</div>
          <div className="text-4xl font-bold text-green-600">
            {formatEth(property.claimable, 6)} ETH
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {txHash && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-blue-600">
              Transaction submitted! Hash: {txHash.slice(0, 10)}...
            </p>
          </div>
        )}

        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleClaim}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors disabled:bg-gray-300"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Claiming...
              </span>
            ) : (
              'Claim Revenue'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClaimRevenue;
