// src/config/contracts.js
// Contract addresses and ABIs for MAK Platform

// Contract addresses by network
export const CONTRACT_ADDRESSES = {
  // Sepolia Testnet
  11155111: {
    PropertyToken: '0x...', // UPDATE AFTER DEPLOYMENT
    PropertyMarketplace: '0x...', // UPDATE AFTER DEPLOYMENT
    RevenueDistribution: '0x...', // UPDATE AFTER DEPLOYMENT
    PropertyOracle: '0x...', // UPDATE AFTER DEPLOYMENT
    Governance: '0x...', // UPDATE AFTER DEPLOYMENT
  },
  // Localhost
  31337: {
    PropertyToken: '0x...', // UPDATE AFTER DEPLOYMENT
    PropertyMarketplace: '0x...', // UPDATE AFTER DEPLOYMENT
    RevenueDistribution: '0x...', // UPDATE AFTER DEPLOYMENT
    PropertyOracle: '0x...', // UPDATE AFTER DEPLOYMENT
    Governance: '0x...', // UPDATE AFTER DEPLOYMENT
  },
  // Ethereum Mainnet (for future)
  1: {
    PropertyToken: '0x...',
    PropertyMarketplace: '0x...',
    RevenueDistribution: '0x...',
    PropertyOracle: '0x...',
    Governance: '0x...',
  },
};

// Simplified ABIs (essential functions only)
export const ABIS = {
  PropertyToken: [
    'function createProperty(string memory uri, uint256 totalShares, uint256 pricePerShare, address propertyOwner) external returns (uint256)',
    'function mintShares(uint256 propertyId, address to, uint256 amount) external',
    'function getPropertyInfo(uint256 propertyId) external view returns (string memory uri, uint256 totalShares, uint256 mintedShares, uint256 pricePerShare, address owner, bool active)',
    'function balanceOf(address account, uint256 id) external view returns (uint256)',
    'function setApprovalForAll(address operator, bool approved) external',
    'function isApprovedForAll(address account, address operator) external view returns (bool)',
    'function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes memory data) external',
    'function propertyCount() external view returns (uint256)',
    'event PropertyCreated(uint256 indexed propertyId, string uri, uint256 totalShares)',
    'event SharesMinted(uint256 indexed propertyId, address indexed to, uint256 amount)',
  ],
  PropertyMarketplace: [
    'function listShares(uint256 propertyId, uint256 amount, uint256 pricePerShare) external returns (uint256)',
    'function buyShares(uint256 listingId, uint256 amount) external payable',
    'function cancelListing(uint256 listingId) external',
    'function getListing(uint256 listingId) external view returns (address seller, uint256 propertyId, uint256 amount, uint256 pricePerShare, bool active)',
    'function getActiveListings(uint256 propertyId) external view returns (uint256[] memory)',
    'function platformFee() external view returns (uint256)',
    'event SharesListed(uint256 indexed listingId, address indexed seller, uint256 propertyId, uint256 amount, uint256 pricePerShare)',
    'event SharesPurchased(uint256 indexed listingId, address indexed buyer, uint256 amount, uint256 totalPrice)',
    'event ListingCancelled(uint256 indexed listingId)',
  ],
  RevenueDistribution: [
    'function distributeRevenue(uint256 propertyId) external payable',
    'function claimRevenue(uint256 propertyId) external',
    'function getClaimableRevenue(address shareholder, uint256 propertyId) external view returns (uint256)',
    'function getPropertyRevenue(uint256 propertyId) external view returns (uint256 totalDistributed, uint256 lastDistribution)',
    'event RevenueDistributed(uint256 indexed propertyId, uint256 amount, uint256 timestamp)',
    'event RevenueClaimed(address indexed shareholder, uint256 indexed propertyId, uint256 amount)',
  ],
  PropertyOracle: [
    'function updatePropertyValue(uint256 propertyId, uint256 currentValue, string memory dataSource) external',
    'function getPropertyValue(uint256 propertyId) external view returns (uint256 value, uint256 lastUpdated)',
    'function getRentalIncome(uint256 propertyId) external view returns (uint256 monthlyIncome, uint256 lastUpdated)',
    'function getOccupancyRate(uint256 propertyId) external view returns (uint256 rate, uint256 lastUpdated)',
  ],
};

// Network configuration
export const NETWORKS = {
  11155111: {
    name: 'Sepolia',
    rpcUrl: 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY',
    blockExplorer: 'https://sepolia.etherscan.io',
    currency: 'ETH',
  },
  31337: {
    name: 'Localhost',
    rpcUrl: 'http://127.0.0.1:8545',
    blockExplorer: 'http://localhost:8545',
    currency: 'ETH',
  },
  1: {
    name: 'Ethereum',
    rpcUrl: 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
    blockExplorer: 'https://etherscan.io',
    currency: 'ETH',
  },
};

// Get contract addresses for current network
export const getContractAddresses = (chainId) => {
  return CONTRACT_ADDRESSES[chainId] || CONTRACT_ADDRESSES[11155111]; // Default to Sepolia
};

// Get network info
export const getNetworkInfo = (chainId) => {
  return NETWORKS[chainId] || NETWORKS[11155111];
};
