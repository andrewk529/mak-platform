import React, { useState, useEffect } from 'react';
import { Calculator, TrendingUp, Shield, Zap, Bitcoin, DollarSign, FileText, CheckCircle, AlertTriangle, Globe } from 'lucide-react';

const MortgageCalculator = () => {
  const [loanDetails, setLoanDetails] = useState({
    propertyPrice: 450000,
    downPayment: 90000,
    loanTerm: 30,
    interestRate: 7.25,
    propertyTax: 4800,
    insurance: 1200,
    pmi: 0,
    hoaFees: 0
  });

  const [cryptoPayment, setCryptoPayment] = useState({
    enabled: false,
    currency: 'BTC',
    amount: 0,
    usdValue: 0,
    volatilityProtection: true
  });

  const [borrowerProfile, setBorrowerProfile] = useState({
    income: 120000,
    creditScore: 750,
    debtToIncome: 28,
    employmentType: 'W2',
    downPaymentSource: 'savings'
  });

  // Mock crypto prices
  const [cryptoPrices, setCryptoPrices] = useState({
    BTC: 43250,
    ETH: 2380,
    USDC: 1.00
  });

  // Calculate mortgage payments
  const calculateMortgage = () => {
    const principal = loanDetails.propertyPrice - loanDetails.downPayment;
    const monthlyRate = loanDetails.interestRate / 100 / 12;
    const totalPayments = loanDetails.loanTerm * 12;
    
    const monthlyPI = principal * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / 
                     (Math.pow(1 + monthlyRate, totalPayments) - 1);
    
    const monthlyTaxes = loanDetails.propertyTax / 12;
    const monthlyInsurance = loanDetails.insurance / 12;
    const monthlyPMI = loanDetails.pmi / 12;
    const monthlyHOA = loanDetails.hoaFees / 12;
    
    const totalMonthlyPayment = monthlyPI + monthlyTaxes + monthlyInsurance + monthlyPMI + monthlyHOA;
    
    return {
      monthlyPI: monthlyPI,
      totalMonthlyPayment: totalMonthlyPayment,
      totalInterest: (monthlyPI * totalPayments) - principal,
      loanAmount: principal
    };
  };

  // AI-powered pre-qualification
  const calculatePreQualification = () => {
    const monthlyIncome = borrowerProfile.income / 12;
    const maxDebtToIncome = 43;
    const maxPayment = (monthlyIncome * maxDebtToIncome) / 100;
    
    const estimatedTaxesInsurance = (loanDetails.propertyPrice * 0.015) / 12;
    const availableForPI = maxPayment - estimatedTaxesInsurance;
    
    const monthlyRate = loanDetails.interestRate / 100 / 12;
    const totalPayments = loanDetails.loanTerm * 12;
    
    const maxLoanAmount = availableForPI * (Math.pow(1 + monthlyRate, totalPayments) - 1) / 
                         (monthlyRate * Math.pow(1 + monthlyRate, totalPayments));
    
    const maxPropertyPrice = maxLoanAmount + loanDetails.downPayment;
    
    let rateAdjustment = 0;
    if (borrowerProfile.creditScore < 620) rateAdjustment = 2.0;
    else if (borrowerProfile.creditScore < 680) rateAdjustment = 0.75;
    else if (borrowerProfile.creditScore < 740) rateAdjustment = 0.25;
    
    const conditions = [];
    if (borrowerProfile.creditScore < 620) conditions.push("Credit score improvement needed");
    if (borrowerProfile.debtToIncome > 43) conditions.push("Debt-to-income ratio too high");
    if (loanDetails.downPayment / loanDetails.propertyPrice < 0.03) conditions.push("Minimum 3% down payment required");
    
    return {
      approved: conditions.length === 0 && borrowerProfile.creditScore >= 620,
      maxLoanAmount: maxLoanAmount,
      maxPropertyPrice: maxPropertyPrice,
      adjustedRate: loanDetails.interestRate + rateAdjustment,
      conditions: conditions,
      confidence: borrowerProfile.creditScore >= 740 ? 'High' : borrowerProfile.creditScore >= 680 ? 'Medium' : 'Low'
    };
  };

  const mortgage = calculateMortgage();
  const preQual = calculatePreQualification();

  // Update crypto amounts when property price changes
  useEffect(() => {
    if (cryptoPayment.enabled) {
      const cryptoAmount = loanDetails.downPayment / cryptoPrices[cryptoPayment.currency];
      setCryptoPayment(prev => ({
        ...prev,
        amount: cryptoAmount,
        usdValue: loanDetails.downPayment
      }));
    }
  }, [loanDetails.downPayment, cryptoPayment.currency, cryptoPayment.enabled]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatCrypto = (amount, currency) => {
    const decimals = currency === 'BTC' ? 6 : currency === 'ETH' ? 4 : 2;
    return amount.toFixed(decimals);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <Calculator className="h-8 w-8 mr-3" />
                Advanced Mortgage Calculator
              </h1>
              <p className="text-blue-100 mt-2">Blockchain-powered transparency with crypto payment options</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-blue-100">Licensed MLO</div>
              <div className="text-lg font-semibold">Michael Kelczewski</div>
              <div className="text-sm text-blue-100">Founder, MAK Realty</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Input Section */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Property Details */}
