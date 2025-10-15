# API Reference

Complete reference for MAK Platform smart contracts and API endpoints.

---

## 📋 Table of Contents

- [Smart Contracts Overview](#smart-contracts-overview)
- [PropertyToken Contract](#propertytoken-contract)
- [PropertyMarketplace Contract](#propertymarketplace-contract)
- [RevenueDistribution Contract](#revenuedistribution-contract)
- [PropertyOracle Contract](#propertyoracle-contract)
- [Governance Contract](#governance-contract)
- [Events Reference](#events-reference)
- [Error Codes](#error-codes)
- [Web3 Integration Examples](#web3-integration-examples)

---

## Smart Contracts Overview

### Contract Addresses

#### Ethereum Mainnet
```javascript
const CONTRACTS = {
  PropertyToken: '0x...', // Coming Soon
  PropertyMarketplace: '0x...', // Coming Soon
  RevenueDistribution: '0x...', // Coming Soon
  PropertyOracle: '0x...', // Coming Soon
  Governance: '0x...', // Coming Soon
};
```

#### Sepolia Testnet
```javascript
const CONTRACTS_TESTNET = {
  PropertyToken: '0x...', // Deployed after setup
  PropertyMarketplace: '0x...', // Deployed after setup
  RevenueDistribution: '0x...', // Deployed after setup
  PropertyOracle: '0x...', // Deployed after setup
  Governance: '0x...', // Deployed after setup
};
```

---

## PropertyToken Contract

**Standard**: ERC-1155 Multi-Token  
**Purpose**: Fractional property ownership tokenization

### Core Functions

#### `createProperty`
Creates a new tokenized property.
```solidity
function createProperty(
    string memory uri,
    uint256 totalShares,
    uint256 pricePerShare,
    address propertyOwner
) external onlyRole(PROPERTY_MANAGER_ROLE) returns (uint256 propertyId)
```

**Parameters**:
- `uri` (string): Metadata URI for the property (IPFS/Arweave)
- `totalShares` (uint256): Total number of shares for the property
- `pricePerShare` (uint256): Price per share in wei
- `propertyOwner` (address): Address of the property owner

**Returns**: `propertyId` (uint256)

**Events**: `PropertyCreated(uint256 indexed propertyId, string uri, uint256 totalShares)`

**Example**:
```javascript
const tx = await propertyToken.createProperty(
  'ipfs://Qm...', // metadata URI
  1000, // 1000 shares
  ethers.utils.parseEther('0.1'), // 0.1 ETH per share
  ownerAddress
);
const receipt = await tx.wait();
const propertyId = receipt.events[0].args.propertyId;
```

---

#### `mintShares`
Mints property shares to a buyer.
```solidity
function mintShares(
    uint256 propertyId,
    address to,
    uint256 amount
) external onlyRole(MINTER_ROLE)
```

**Parameters**:
- `propertyId` (uint256): ID of the property
- `to` (address): Address receiving the shares
- `amount` (uint256): Number of shares to mint

**Example**:
```javascript
await propertyToken.mintShares(
  propertyId,
  buyerAddress,
  10 // 10 shares
);
```

---

#### `getPropertyInfo`
Retrieves property information.
```solidity
function getPropertyInfo(uint256 propertyId) 
    external 
    view 
    returns (
        string memory uri,
        uint256 totalShares,
        uint256 mintedShares,
        uint256 pricePerShare,
        address owner,
        bool active
    )
```

**Returns**:
- `uri`: Property metadata URI
- `totalShares`: Total shares available
- `mintedShares`: Shares already minted
- `pricePerShare`: Current price per share
- `owner`: Property owner address
- `active`: Whether property is active

**Example**:
```javascript
const info = await propertyToken.getPropertyInfo(propertyId);
console.log('Property URI:', info.uri);
console.log('Total Shares:', info.totalShares.toString());
console.log('Price per Share:', ethers.utils.formatEther(info.pricePerShare));
```

---

#### `balanceOf`
Returns share balance for an address (ERC-1155 standard).
```solidity
function balanceOf(address account, uint256 id) 
    external 
    view 
    returns (uint256)
```

**Example**:
```javascript
const balance = await propertyToken.balanceOf(userAddress, propertyId);
console.log('User owns', balance.toString(), 'shares');
```

---

## PropertyMarketplace Contract

**Purpose**: Decentralized marketplace for trading property shares

### Core Functions

#### `listShares`
Lists property shares for sale.
```solidity
function listShares(
    uint256 propertyId,
    uint256 amount,
    uint256 pricePerShare
) external returns (uint256 listingId)
```

**Parameters**:
- `propertyId` (uint256): Property token ID
- `amount` (uint256): Number of shares to sell
- `pricePerShare` (uint256): Price per share in wei

**Events**: `SharesListed(uint256 indexed listingId, address seller, uint256 propertyId, uint256 amount, uint256 price)`

**Example**:
```javascript
// Approve marketplace to transfer shares
await propertyToken.setApprovalForAll(marketplaceAddress, true);

// List shares
const tx = await marketplace.listShares(
  propertyId,
  50, // sell 50 shares
  ethers.utils.parseEther('0.15') // at 0.15 ETH each
);
```

---

#### `buyShares`
Purchases listed property shares.
```solidity
function buyShares(uint256 listingId, uint256 amount) 
    external 
    payable
```

**Parameters**:
- `listingId` (uint256): ID of the listing
- `amount` (uint256): Number of shares to buy

**Events**: `SharesPurchased(uint256 indexed listingId, address buyer, uint256 amount, uint256 totalPrice)`

**Example**:
```javascript
const listing = await marketplace.getListing(listingId);
const totalPrice = listing.pricePerShare.mul(amount);

await marketplace.buyShares(listingId, amount, {
  value: totalPrice
});
```

---

#### `cancelListing`
Cancels an active listing.
```solidity
function cancelListing(uint256 listingId) external
```

**Example**:
```javascript
await marketplace.cancelListing(listingId);
```

---

#### `getListing`
Retrieves listing details.
```solidity
function getListing(uint256 listingId)
    external
    view
    returns (
        address seller,
        uint256 propertyId,
        uint256 amount,
        uint256 pricePerShare,
        bool active
    )
```

---

#### `getActiveListings`
Returns all active listings for a property.
```solidity
function getActiveListings(uint256 propertyId)
    external
    view
    returns (uint256[] memory listingIds)
```

---

## RevenueDistribution Contract

**Purpose**: Automated rental income distribution to token holders

### Core Functions

#### `distributeRevenue`
Distributes rental income to all shareholders.
```solidity
function distributeRevenue(uint256 propertyId) 
    external 
    payable 
    onlyRole(DISTRIBUTOR_ROLE)
```

**Parameters**:
- `propertyId` (uint256): Property to distribute revenue for

**Events**: `RevenueDistributed(uint256 indexed propertyId, uint256 amount, uint256 timestamp)`

**Example**:
```javascript
// Platform sends rental income to contract
await revenueDistribution.distributeRevenue(propertyId, {
  value: ethers.utils.parseEther('10') // 10 ETH rental income
});
```

---

#### `claimRevenue`
Allows shareholders to claim their accumulated revenue.
```solidity
function claimRevenue(uint256 propertyId) external
```

**Events**: `RevenueClaimed(address indexed shareholder, uint256 propertyId, uint256 amount)`

**Example**:
```javascript
await revenueDistribution.claimRevenue(propertyId);
```

---

#### `getClaimableRevenue`
Returns claimable amount for a shareholder.
```solidity
function getClaimableRevenue(
    address shareholder,
    uint256 propertyId
) external view returns (uint256)
```

**Example**:
```javascript
const claimable = await revenueDistribution.getClaimableRevenue(
  userAddress,
  propertyId
);
console.log('Claimable:', ethers.utils.formatEther(claimable), 'ETH');
```

---

#### `getPropertyRevenue`
Returns total revenue distributed for a property.
```solidity
function getPropertyRevenue(uint256 propertyId)
    external
    view
    returns (uint256 totalDistributed, uint256 lastDistribution)
```

---

## PropertyOracle Contract

**Purpose**: Integration of real-world property data on-chain

### Core Functions

#### `updatePropertyValue`
Updates property valuation data.
```solidity
function updatePropertyValue(
    uint256 propertyId,
    uint256 currentValue,
    string memory dataSource
) external onlyRole(ORACLE_ROLE)
```

**Events**: `PropertyValueUpdated(uint256 indexed propertyId, uint256 newValue, uint256 timestamp)`

---

#### `updateRentalIncome`
Updates monthly rental income data.
```solidity
function updateRentalIncome(
    uint256 propertyId,
    uint256 monthlyIncome
) external onlyRole(ORACLE_ROLE)
```

---

#### `getPropertyValue`
Retrieves current property valuation.
```solidity
function getPropertyValue(uint256 propertyId)
    external
    view
    returns (uint256 value, uint256 lastUpdated)
```

---

#### `getRentalIncome`
Gets rental income data.
```solidity
function getRentalIncome(uint256 propertyId)
    external
    view
    returns (uint256 monthlyIncome, uint256 lastUpdated)
```

---

## Governance Contract

**Purpose**: Decentralized platform governance and voting

### Core Functions

#### `createProposal`
Creates a new governance proposal.
```solidity
function createProposal(
    string memory description,
    address[] memory targets,
    uint256[] memory values,
    bytes[] memory calldatas
) external returns (uint256 proposalId)
```

**Example**:
```javascript
const tx = await governance.createProposal(
  'Reduce platform fee to 2%',
  [marketplaceAddress],
  [0],
  [encodedCalldata]
);
```

---

#### `castVote`
Cast vote on a proposal.
```solidity
function castVote(uint256 proposalId, uint8 support) external
```

**Parameters**:
- `proposalId`: Proposal to vote on
- `support`: 0=Against, 1=For, 2=Abstain

---

#### `executeProposal`
Executes a passed proposal after timelock.
```solidity
function executeProposal(uint256 proposalId) external
```

---

## Events Reference

### PropertyToken Events
```solidity
event PropertyCreated(
    uint256 indexed propertyId,
    string uri,
    uint256 totalShares
);

event SharesMinted(
    uint256 indexed propertyId,
    address indexed to,
    uint256 amount
);

event PropertyUpdated(
    uint256 indexed propertyId,
    uint256 newPrice
);
```

### Marketplace Events
```solidity
event SharesListed(
    uint256 indexed listingId,
    address indexed seller,
    uint256 propertyId,
    uint256 amount,
    uint256 pricePerShare
);

event SharesPurchased(
    uint256 indexed listingId,
    address indexed buyer,
    uint256 amount,
    uint256 totalPrice
);

event ListingCancelled(
    uint256 indexed listingId
);
```

### Revenue Events
```solidity
event RevenueDistributed(
    uint256 indexed propertyId,
    uint256 amount,
    uint256 timestamp
);

event RevenueClaimed(
    address indexed shareholder,
    uint256 indexed propertyId,
    uint256 amount
);
```

---

## Error Codes

### Custom Errors
```solidity
error PropertyNotFound(uint256 propertyId);
error InsufficientShares(uint256 requested, uint256 available);
error InvalidPrice(uint256 price);
error UnauthorizedAccess(address caller);
error ListingNotActive(uint256 listingId);
error InsufficientPayment(uint256 required, uint256 provided);
error TransferFailed();
error PropertyNotActive(uint256 propertyId);
```

---

## Web3 Integration Examples

### Setup
```javascript
import { ethers } from 'ethers';
import PropertyTokenABI from './abis/PropertyToken.json';
import MarketplaceABI from './abis/PropertyMarketplace.json';

const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();

const propertyToken = new ethers.Contract(
  PROPERTY_TOKEN_ADDRESS,
  PropertyTokenABI,
  signer
);

const marketplace = new ethers.Contract(
  MARKETPLACE_ADDRESS,
  MarketplaceABI,
  signer
);
```

### Example: Buy Property Shares
```javascript
async function buyPropertyShares(propertyId, amount) {
  try {
    // Get property info
    const info = await propertyToken.getPropertyInfo(propertyId);
    const totalCost = info.pricePerShare.mul(amount);
    
    // Mint shares (assuming direct purchase from platform)
    const tx = await propertyToken.mintShares(
      propertyId,
      await signer.getAddress(),
      amount,
      { value: totalCost }
    );
    
    const receipt = await tx.wait();
    console.log('Shares purchased!', receipt.transactionHash);
    
    return receipt;
  } catch (error) {
    console.error('Purchase failed:', error);
    throw error;
  }
}
```

### Example: List Shares for Sale
```javascript
async function listSharesForSale(propertyId, amount, pricePerShare) {
  try {
    // Approve marketplace
    const approvalTx = await propertyToken.setApprovalForAll(
      MARKETPLACE_ADDRESS,
      true
    );
    await approvalTx.wait();
    
    // List shares
    const listTx = await marketplace.listShares(
      propertyId,
      amount,
      pricePerShare
    );
    const receipt = await listTx.wait();
    
    // Extract listing ID from event
    const event = receipt.events.find(e => e.event === 'SharesListed');
    const listingId = event.args.listingId;
    
    console.log('Listed successfully! Listing ID:', listingId.toString());
    return listingId;
  } catch (error) {
    console.error('Listing failed:', error);
    throw error;
  }
}
```

### Example: Claim Revenue
```javascript
async function claimRentalIncome(propertyId) {
  try {
    // Check claimable amount
    const claimable = await revenueDistribution.getClaimableRevenue(
      await signer.getAddress(),
      propertyId
    );
    
    if (claimable.eq(0)) {
      console.log('No revenue to claim');
      return;
    }
    
    console.log('Claiming:', ethers.utils.formatEther(claimable), 'ETH');
    
    // Claim
    const tx = await revenueDistribution.claimRevenue(propertyId);
    const receipt = await tx.wait();
    
    console.log('Revenue claimed!', receipt.transactionHash);
    return receipt;
  } catch (error) {
    console.error('Claim failed:', error);
    throw error;
  }
}
```

### Example: Listen to Events
```javascript
// Listen for new property listings
marketplace.on('SharesListed', (listingId, seller, propertyId, amount, price) => {
  console.log('New listing:', {
    listingId: listingId.toString(),
    seller,
    propertyId: propertyId.toString(),
    amount: amount.toString(),
    price: ethers.utils.formatEther(price)
  });
});

// Listen for revenue distributions
revenueDistribution.on('RevenueDistributed', (propertyId, amount, timestamp) => {
  console.log('Revenue distributed for property', propertyId.toString());
  console.log('Amount:', ethers.utils.formatEther(amount), 'ETH');
});
```

---

## Rate Limits & Best Practices

### RPC Provider Limits
- **Infura**: 100,000 requests/day (free tier)
- **Alchemy**: 300M compute units/month (free tier)
- **Public RPCs**: Recommended to use with caching

### Best Practices
1. **Cache contract instances** - don't recreate on every call
2. **Batch read operations** using `multicall` patterns
3. **Use events** instead of polling for state changes
4. **Handle errors gracefully** with proper user feedback
5. **Estimate gas** before transactions
6. **Use proper nonce management** for sequential transactions

---

## Testing Endpoints

### Sepolia Testnet
```javascript
const TESTNET_CONFIG = {
  rpcUrl: 'https://sepolia.infura.io/v3/YOUR_KEY',
  chainId: 11155111,
  contracts: {
    PropertyToken: '0x...',
    Marketplace: '0x...',
  }
};
```

### Local Development
```javascript
const LOCAL_CONFIG = {
  rpcUrl: 'http://127.0.0.1:8545',
  chainId: 31337,
  contracts: {
    // Deployed via hardhat node
  }
};
```

---

## Support

For API questions or integration help:
- **GitHub Issues**: [github.com/andrewk529/mak-platform/issues](https://github.com/andrewk529/mak-platform/issues)
- **Email**: andrewk529@protonmail.com
- **Discord**: [Coming Soon]

---

**Last Updated**: October 2025  
**Version**: 1.0.0

*For the latest API documentation, check the GitHub repository.*
