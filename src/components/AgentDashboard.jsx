import React, { useState } from 'react';
import { 
  BarChart3, Users, Home, DollarSign, Calendar, Bell, TrendingUp, 
  MapPin, Phone, Mail, Clock, CheckCircle, AlertTriangle, 
  FileText, Target, Zap, Brain, Shield, Bitcoin 
} from 'lucide-react';

const AgentDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('30days');

  // Mock data
  const dashboardData = {
    metrics: {
      activListings: 12,
      pendingSales: 8,
      closedThisMonth: 15,
      monthlyCommission: 85000,
      pipelineValue: 2400000,
      mortgageApps: 23,
      insuranceQuotes: 31,
      cryptoTransactions: 3
    },
    recentActivity: [
      { id: 1, type: 'listing', client: 'Johnson Family', property: '123 Oak St', status: 'active', time: '2 hours ago' },
      { id: 2, type: 'mortgage', client: 'Sarah Chen', amount: 450000, status: 'approved', time: '4 hours ago' },
      { id: 3, type: 'insurance', client: 'Mike Rodriguez', policy: 'Home + Auto Bundle', status: 'quoted', time: '6 hours ago' },
      { id: 4, type: 'crypto', client: 'International Buyer', amount: 1750000, currency: 'BTC', status: 'pending', time: '1 day ago' }
    ],
    upcomingTasks: [
      { id: 1, task: 'Property showing - 456 Pine Ave', time: '2:00 PM Today', priority: 'high' },
      { id: 2, task: 'Mortgage closing - Wilson purchase', time: '10:00 AM Tomorrow', priority: 'high' },
      { id: 3, task: 'Insurance policy review call', time: '3:30 PM Tomorrow', priority: 'medium' },
      { id: 4, task: 'Blockchain transaction verification', time: 'Friday 11:00 AM', priority: 'medium' }
    ],
    leads: [
      { id: 1, name: 'Emily Thompson', source: 'Website', budget: '400-500k', status: 'hot', lastContact: '1 day ago', aiScore: 92 },
      { id: 2, name: 'David Park', source: 'Referral', budget: '600-800k', status: 'warm', lastContact: '3 days ago', aiScore: 78 },
      { id: 3, name: 'Lisa Chang', source: 'Crypto Inquiry', budget: '1M+', status: 'cold', lastContact: '1 week ago', aiScore: 65 }
    ]
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'hot': return 'bg-red-100 text-red-800';
      case 'warm': return 'bg-yellow-100 text-yellow-800';
      case 'cold': return 'bg-blue-100 text-blue-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'quoted': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'border-l-red-500 bg-red-50';
      case 'medium': return 'border-l-yellow-500 bg-yellow-50';
      case 'low': return 'border-l-green-500 bg-green-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'listing': return <Home className="h-5 w-5 text-blue-600" />;
      case 'mortgage': return <DollarSign className="h-5 w-5 text-green-600" />;
      case 'insurance': return <Shield className="h-5 w-5 text-purple-600" />;
      case 'crypto': return <Bitcoin className="h-5 w-5 text-orange-600" />;
      default: return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">MAK Realty Dashboard</h1>
              <p className="text-gray-600">Welcome back, Michael Kelczewski - MAK Realty Founder</p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="7days">Last 7 days</option>
                <option value="30days">Last 30 days</option>
                <option value="90days">Last 90 days</option>
                <option value="year">This year</option>
              </select>
              <button className="relative p-2 text-gray-400 hover:text-gray-500">
                <Bell className="h-6 w-6" />
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400"></span>
              </button>
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'leads', label: 'Leads', icon: Users },
                { id: 'listings', label: 'Listings', icon: Home },
                { id: 'transactions', label: 'Transactions', icon: DollarSign },
                { id: 'calendar', label: 'Calendar', icon: Calendar }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Listings</p>
                    <p className="text-3xl font-bold text-gray-900">{dashboardData.metrics.activListings}</p>
                  </div>
                  <Home className="h-8 w-8 text-blue-600" />
                </div>
                <div className="mt-4 flex items-center text-sm text-green-600">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  +2 this week
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending Sales</p>
                    <p className="text-3xl font-bold text-gray-900">{dashboardData.metrics.pendingSales}</p>
                  </div>
                  <Target className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="mt-4 flex items-center text-sm text-blue-600">
                  <Clock className="h-4 w-4 mr-1" />
                  Avg 18 days to close
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Monthly Commission</p>
                    <p className="text-3xl font-bold text-gray-900">{formatCurrency(dashboardData.metrics.monthlyCommission)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
                <div className="mt-4 flex items-center text-sm text-green-600">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  +12% vs last month
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pipeline Value</p>
                    <p className="text-3xl font-bold text-gray-900">{formatCurrency(dashboardData.metrics.pipelineValue)}</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-purple-600" />
                </div>
                <div className="mt-4 flex items-center text-sm text-purple-600">
                  <Zap className="h-4 w-4 mr-1" />
                  High conversion rate
                </div>
              </div>
            </div>

            {/* Service Integration Metrics */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
              <h3 className="text-lg font-semibold mb-4 text-blue-900">Integrated Services Performance</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">Mortgage Applications</h4>
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-green-600">{dashboardData.metrics.mortgageApps}</div>
                  <div className="text-sm text-gray-600">85% approval rate</div>
                </div>
                
                <div className="bg-white rounded-lg p-4">
