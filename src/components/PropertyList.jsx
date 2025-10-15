// src/components/PropertyList.jsx
import React, { useState, useEffect } from 'react';
import PropertyCard from './PropertyCard';
import BuyModal from './BuyModal';
import { ethers } from 'ethers';

const PropertyList = ({ contracts, account }) => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [error, setError] = useState(null);

  // Fetch properties from contract
  useEffect(() => {
    const fetchProperties = async () => {
      if (!contracts.propertyToken) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Get property count
        const count = await contracts.propertyToken.propertyCount();
        const propertyList = [];

        // Fetch each property
        for (let i = 1; i <= count.toNumber(); i++) {
          try {
            const info = await contracts.propertyToken.getPropertyInfo(i);
            
            // Get additional data from oracle if available
            let monthlyIncome = ethers.BigNumber.from(0);
            let occupancyRate = 0;
            
            if (contracts.propertyOracle) {
              try {
                const rentalData = await contracts.propertyOracle.getRentalIncome(i);
                monthlyIncome = rentalData.monthlyIncome;
                
                const occupancyData = await contracts.propertyOracle.getOccupancyRate(i);
                occupancyRate = occupancyData.rate.toNumber();
              } catch (err) {
                console.log('Oracle data not available for property', i);
              }
            }

            // Calculate total value
            const totalValue = info.pricePerShare.mul(info.totalShares);

            propertyList.push({
              id: i,
              name: `Property #${i}`,
              location: 'Downtown District', // Would come from metadata
              image: null, // Would come from IPFS metadata
              uri: info.uri,
              totalShares: info.totalShares.toNumber(),
              mintedShares: info.mintedShares.toNumber(),
              pricePerShare: info.pricePerShare,
              owner: info.owner,
              active: info.active,
              totalValue,
              monthlyIncome,
              occupancyRate,
            });
          } catch (err) {
            console.error(`Error fetching property ${i}:`, err);
          }
        }

        setProperties(propertyList);
      } catch (err) {
        console.error('Error fetching properties:', err);
        setError('Failed to load properties. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [contracts]);

  const handleBuyClick = (property) => {
    if (!account) {
      alert('Please connect your wallet first');
      return;
    }
    setSelectedProperty(property);
    setShowBuyModal(true);
  };

  const handleBuySuccess = () => {
    setShowBuyModal(false);
    setSelectedProperty(null);
    // Refresh properties
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
        <div className="text-6xl mb-4">🏠</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No Properties Available
        </h3>
        <p className="text-gray-600">
          Properties will appear here once they are tokenized.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((property) => (
          <PropertyCard
            key={property.id}
            property={property}
            onBuyClick={handleBuyClick}
          />
        ))}
      </div>

      {showBuyModal && selectedProperty && (
        <BuyModal
          property={selectedProperty}
          contracts={contracts}
          account={account}
          onClose={() => setShowBuyModal(false)}
          onSuccess={handleBuySuccess}
        />
      )}
    </>
  );
};

export default PropertyList;
