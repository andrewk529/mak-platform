// src/components/PropertyCard.jsx
import React from 'react';
import { formatEth, formatNumber, formatPercent } from '../utils/formatters';

const PropertyCard = ({ property, onBuyClick }) => {
  const {
    id,
    name,
    location,
    image,
    totalShares,
    mintedShares,
    pricePerShare,
    totalValue,
    monthlyIncome,
    occupancyRate,
  } = property;

  const availableShares = totalShares - mintedShares;
  const percentageSold = (mintedShares / totalShares) * 100;
  const apy = monthlyIncome && totalValue ? ((monthlyIncome * 12) / totalValue) * 100 : 0;

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 animate-fadeIn">
      {/* Property Image */}
      <div className="relative h-48 bg-gray-200">
        {image ? (
          <img src={image} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200">
            <span className="text-4xl">🏠</span>
          </div>
        )}
        {occupancyRate && (
          <div className="absolute top-3 right-3 px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full">
            {occupancyRate}% Occupied
          </div>
        )}
      </div>

      {/* Property Details */}
      <div className="p-5">
        {/* Title and Location */}
        <h3 className="text-xl font-bold text-gray-900 mb-1">{name}</h3>
        <p className="text-sm text-gray-500 mb-4">📍 {location}</p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-xs text-gray-500 mb-1">Price per Share</div>
            <div className="text-lg font-bold text-gray-900">
              {formatEth(pricePerShare, 3)} ETH
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Total Value</div>
            <div className="text-lg font-bold text-gray-900">
              {formatEth(totalValue, 2)} ETH
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Monthly Income</div>
            <div className="text-lg font-bold text-green-600">
              {formatEth(monthlyIncome, 3)} ETH
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">APY</div>
            <div className="text-lg font-bold text-primary-600">
              {formatPercent(apy, 2)}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Shares Sold</span>
            <span>
              {formatNumber(mintedShares)} / {formatNumber(totalShares)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${percentageSold}%` }}
            ></div>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {formatNumber(availableShares)} shares available
          </div>
        </div>

        {/* Buy Button */}
        <button
          onClick={() => onBuyClick(property)}
          disabled={availableShares === 0}
          className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {availableShares === 0 ? 'Sold Out' : 'Buy Shares'}
        </button>
      </div>
    </div>
  );
};

export default PropertyCard;
