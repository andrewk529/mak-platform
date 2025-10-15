// src/components/Marketplace.jsx
import React from 'react';

const Marketplace = () => {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
      <div className="text-6xl mb-4">🏪</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        Marketplace Coming Soon
      </h3>
      <p className="text-gray-600 mb-6">
        Secondary market for trading property shares will be available soon
      </p>
      <div className="max-w-md mx-auto bg-white rounded-lg p-6 shadow-sm">
        <h4 className="font-semibold text-gray-900 mb-3">Upcoming Features:</h4>
        <ul className="text-left text-sm text-gray-600 space-y-2">
          <li className="flex items-center">
            <span className="text-green-500 mr-2">✓</span>
            Buy/Sell shares peer-to-peer
          </li>
          <li className="flex items-center">
            <span className="text-green-500 mr-2">✓</span>
            Set your own listing prices
          </li>
          <li className="flex items-center">
            <span className="text-green-500 mr-2">✓</span>
            View order book and price history
          </li>
          <li className="flex items-center">
            <span className="text-green-500 mr-2">✓</span>
            Instant settlement via smart contracts
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Marketplace;
