import React, { useState, useEffect } from 'react';
import { Shield, Home, Car, Heart, Calculator, TrendingDown, CheckCircle, AlertTriangle, FileText, Phone, Clock, DollarSign } from 'lucide-react';

const InsuranceIntegration = () => {
  const [propertyDetails, setPropertyDetails] = useState({
    address: '234 Elm Street, Downtown',
    propertyValue: 450000,
    yearBuilt: 2018,
    sqft: 1900,
    propertyType: 'Condo',
    securitySystem: true
  });

  const [bundleOptions, setBundleOptions] = useState({
    auto: false,
    life: false,
    umbrella: false
  });

  const [quotes, setQuotes] = useState([]);

  // Mock insurance company data
  const insuranceCarriers = [
    {
      id: 1,
      name: 'State Farm',
      rating: 'A++',
      homeQuote: 1450,
      autoQuote: 1200,
      lifeQuote: 45,
      umbrellaQuote: 250,
      discounts: ['Multi-policy', 'Security system', 'Claims-free'],
      features: ['24/7 Claims', 'Local Agent', 'Mobile App']
    },
    {
      id: 2,
      name: 'Allstate',
      rating: 'A+',
      homeQuote: 1380,
      autoQuote: 1150,
      lifeQuote: 42,
      umbrellaQuote: 230,
      discounts: ['Bundle discount', 'Good credit', 'New home'],
      features: ['Claim Satisfaction Guarantee', 'Accident Forgiveness', 'Digital ID Cards']
    },
    {
      id: 3,
      name: 'USAA',
      rating: 'A++',
      homeQuote: 1200,
      autoQuote: 980,
      lifeQuote: 38,
      umbrellaQuote: 200,
      discounts: ['Military discount', 'Multi-vehicle', 'Safe driver'],
      features: ['Military Focused', 'Exceptional Service', 'No Claims Bonus'],
      militaryOnly: true
    }
  ];

  const calculateBundleSavings = (carrier) => {
    let savings = 0;
    let totalAnnual = carrier.homeQuote;

    if (bundleOptions.auto) {
      totalAnnual += carrier.autoQuote * 0.85;
      savings += carrier.autoQuote * 0.15;
    }
    if (bundleOptions.life) {
      totalAnnual += carrier.lifeQuote * 12 * 0.9;
      savings += carrier.lifeQuote * 12 * 0.1;
    }
    if (bundleOptions.umbrella) {
      totalAnnual += carrier.umbrellaQuote * 0.8;
      savings += carrier.umbrellaQuote * 0.2;
    }

    return { totalAnnual, annualSavings: savings };
  };

  useEffect(() => {
    const quotesWithSavings = insuranceCarriers.map(carrier => ({
      ...carrier,
      bundleAnalysis: calculateBundleSavings(carrier)
    })).sort((a, b) => a.homeQuote - b.homeQuote);

    setQuotes(quotesWithSavings);
  }, [bundleOptions]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <Shield className="h-8 w-8 mr-3" />
                Insurance Integration Platform
              </h1>
              <p className="text-green-100 mt-2">Complete protection for your real estate investment</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-green-100">Licensed Insurance Professional</div>
              <div className="text-lg font-semibold">Michael Kelczewski</div>
              <div className="text-sm text-green-100">MAK Realty Founder</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Input Section */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Property Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Home className="h-5 w-5 mr-2 text-blue-600" />
                Property Details
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Property Value</label>
                  <input
                    type="number"
                    value={propertyDetails.propertyValue}
                    onChange={(e) => setPropertyDetails({...propertyDetails, propertyValue: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Year Built</label>
                  <input
                    type="number"
                    value={propertyDetails.yearBuilt}
                    onChange={(e) => setPropertyDetails({...propertyDetails, yearBuilt: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Security System</span>
                  <button
                    onClick={() => setPropertyDetails({...propertyDetails, securitySystem: !propertyDetails.securitySystem})}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      propertyDetails.securitySystem ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      propertyDetails.securitySystem ? 'translate-x-5' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Bundle Options */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <TrendingDown className="h-5 w-5 mr-2 text-green-600" />
                Bundle & Save
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Car className="h-4 w-4 mr-2 text-blue-600" />
                    <span className="text-sm">Auto Insurance</span>
                  </div>
                  <button
                    onClick={() => setBundleOptions({...bundleOptions, auto: !bundleOptions.auto})}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      bundleOptions.auto ? 'bg-green-600' : 'bg-gray-200'
                    }`}
                  >
                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      bundleOptions.auto ? 'translate-x-5' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Heart className="h-4 w-4 mr-2 text-red-600" />
                    <span className="text-sm">Life Insurance</span>
                  </div>
                  <button
                    onClick={() => setBundleOptions({...bundleOptions, life: !bundleOptions.life})}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      bundleOptions.life ? 'bg-green-600' : 'bg-gray-200'
                    }`}
                  >
                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      bundleOptions.life ? 'translate-x-5' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              </div>
              
              {(bundleOptions.auto || bundleOptions.life) && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-800 font-medium">Bundle Savings Available!</p>
                  <p className="text-xs text-green-700 mt-1">Save up to 25% by bundling multiple policies</p>
                </div>
              )}
            </div>
          </div>

          {/* Quotes Section */}
          <div className="lg:col-span-3">
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Insurance Quotes</h2>
              <p className="text-gray-600">Personalized recommendations based on your property and preferences</p>
            </div>

            <div className="space-y-6">
              {quotes.map((quote) => (
                <div key={quote.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{quote.name}</h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-sm text-gray-600">Rating: {quote.rating}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          {formatCurrency(quote.homeQuote)}<span className="text-sm text-gray-500">/year</span>
                        </div>
                        {quote.bundleAnalysis.annualSavings > 0 && (
                          <div className="text-sm text-green-600">
                            Save {formatCurrency(quote.bundleAnalysis.annualSavings)} with bundles
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bundle Pricing */}
                    {(bundleOptions.auto || bundleOptions.life) && (
                      <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
                        <h4 className="font-semibold text-green-800 mb-2">Bundle Pricing</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <div className="font-medium text-green-700">Home</div>
                            <div className="text-green-800">{formatCurrency(quote.homeQuote)}</div>
                          </div>
                          {bundleOptions.auto && (
                            <div>
                              <div className="font-medium text-green-700">Auto (15% off)</div>
                              <div className="text-green-800">{formatCurrency(quote.autoQuote * 0.85)}</div>
                            </div>
                          )}
                          {bundleOptions.life && (
                            <div>
                              <div className="font-medium text-green-700">Life (10% off)</div>
                              <div className="text-green-800">{formatCurrency(quote.lifeQuote * 12 * 0.9)}</div>
                            </div>
                          )}
                        </div>
                        <div className="mt-3 pt-3 border-t border-green-300">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold text-green-800">Bundle Total:</span>
                            <span className="text-xl font-bold text-green-800">
                              {formatCurrency(quote.bundleAnalysis.totalAnnual)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Features & Discounts */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Key Features</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {quote.features.map((feature, index) => (
                            <li key={index} className="flex items-center">
                              <CheckCircle className="h-3 w-3 mr-2 text-green-600" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Available Discounts</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {quote.discounts.map((discount, index) => (
                            <li key={index} className="flex items-center">
                              <TrendingDown className="h-3 w-3 mr-2 text-green-600" />
                              {discount}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-3">
                      <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">
                        Get Full Quote
                      </button>
                      <button className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors">
                        Apply Now
                      </button>
                      <button className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center">
                        <Phone className="h-4 w-4 mr-1" />
                        Call Agent
                      </button>
                    </div>

                    {quote.militaryOnly && (
                      <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
                        <p className="text-sm text-blue-800">
                          <AlertTriangle className="h-4 w-4 inline mr-1" />
                          USAA membership requires military affiliation
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsuranceIntegration;
