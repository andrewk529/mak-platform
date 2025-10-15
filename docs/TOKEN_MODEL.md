# Token Model & Economics

Comprehensive documentation of MAK Platform's tokenomics, governance structure, and revenue distribution mechanisms.

---

## 📋 Table of Contents

- [Token Overview](#token-overview)
- [Property Token Structure](#property-token-structure)
- [Revenue Distribution Model](#revenue-distribution-model)
- [Governance Framework](#governance-framework)
- [Fee Structure](#fee-structure)
- [Marketplace Economics](#marketplace-economics)
- [Economic Security](#economic-security)

---

## Token Overview

MAK Platform utilizes a dual-token system:

1. **Property Tokens (PT)** - ERC-1155 tokens representing fractional property ownership
2. **MAK Governance Token** - Platform governance and utility token (Future Phase)

### Property Token Standard

**Standard**: ERC-1155 (Multi-Token)  
**Why ERC-1155?**
- Multiple properties in single contract (gas efficient)
- Fractional shares per property
- Batch transfers supported
- Reduced deployment costs

---

## Property Token Structure

### Token Identification

Each property has a unique token ID starting from 1.

### Share Distribution Example
```javascript
Property Tokenization:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Property Value: $500,000
Total Shares: 1,000
Price per Share: $500
Minimum Purchase: 1 share ($500)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Investor Ownership:
- Alice: 100 shares (10%) → $50,000 worth
- Bob: 50 shares (5%) → $25,000 worth  
- Carol: 25 shares (2.5%) → $12,500 worth
- Platform Reserve: 825 shares (82.5%)
```

### Token Metadata Structure

Each property token includes metadata stored on IPFS:
```json
{
  "name": "Luxury Downtown Condo #101",
  "description": "Premium 2BR/2BA in downtown financial district",
  "image": "ipfs://Qm.../property-image.jpg",
  "attributes": [
    {
      "trait_type": "Property Type",
      "value": "Residential Condo"
    },
    {
      "trait_type": "Location",
      "value": "Downtown Manhattan, NY"
    },
    {
      "trait_type": "Total Shares",
      "value": 1000
    },
    {
      "trait_type": "Initial Valuation",
      "value": 500000
    }
  ]
}
```

---

## Revenue Distribution Model

### Revenue Sources

Property token holders earn from two sources:

#### 1. Rental Income (Monthly Distribution)
```
Monthly Rental Income:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Gross Rent: $3,500
- Property Management (8%): -$280
- Maintenance Reserve (5%): -$175
- Platform Fee (2.5%): -$87.50
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Net Distributable: $2,957.50

Per Share (1000 shares): $2.96/share

Investor Returns:
- Alice (100 shares): $296/month
- Bob (50 shares): $148/month
- Carol (25 shares): $74/month
```

#### 2. Capital Appreciation (On Sale)
```
Property Sale Example:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Purchase Price: $500,000
Sale Price (3 years): $575,000
Capital Gain: $75,000

Distribution:
- Platform Fee (2.5%): $1,875
- Net to Shareholders: $73,125
- Per Share Gain: $73.13

Alice (100 shares) ROI:
- Original Investment: $50,000
- Appreciation: $7,313
- Rental Income (36 mo): $10,656
- Total Return: $17,969
- ROI: 35.9% over 3 years
```

### Distribution Mechanism

**Smart Contract Automation**:
```solidity
// Revenue distribution is automated via smart contract
function distributeRevenue(uint256 propertyId) external payable {
    // 1. Calculate per-share amount
    uint256 totalShares = propertyToken.totalShares(propertyId);
    uint256 perShareAmount = msg.value / totalShares;
    
    // 2. Update claimable balances
    // Each shareholder can claim proportionally
    
    // 3. Emit distribution event
    emit RevenueDistributed(propertyId, msg.value, block.timestamp);
}

// Shareholders claim their portion
function claimRevenue(uint256 propertyId) external {
    uint256 shares = propertyToken.balanceOf(msg.sender, propertyId);
    uint256 claimable = calculateClaimable(msg.sender, propertyId);
    
    // Transfer ETH to shareholder
    payable(msg.sender).transfer(claimable);
}
```

---

## Governance Framework

### Governance Token (MAK) - Future Implementation

**Total Supply**: 1,000,000,000 MAK  
**Distribution**:
- Community Treasury: 40% (400M)
- Early Investors: 20% (200M)
- Team & Advisors: 15% (150M) - 4 year vest
- Platform Rewards: 15% (150M)
- Liquidity Mining: 10% (100M)

### Voting Power
```
Governance Voting Weight:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1 MAK Token = 1 Vote

Minimum Proposal Threshold: 100,000 MAK (0.01%)
Quorum Required: 40,000,000 MAK (4%)
Voting Period: 7 days
Timelock: 48 hours
```

### Governance Scope

Token holders can vote on:

1. **Platform Parameters**
   - Fee adjustments
   - Minimum investment amounts
   - Listing requirements

2. **Treasury Management**
   - Fund allocation
   - Grant programs
   - Strategic partnerships

3. **Protocol Upgrades**
   - Smart contract improvements
   - New feature deployment
   - Security enhancements

4. **Property Operations**
   - Major property decisions (sale, renovation)
   - Property manager selection
   - Rental rate adjustments

### Proposal Process
```
Governance Proposal Lifecycle:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. DRAFT → Community discussion (Forum)
   ↓
2. PROPOSAL → On-chain submission (100k MAK)
   ↓
3. VOTING → 7-day voting period
   ↓
4. TIMELOCK → 48-hour delay (if passed)
   ↓
5. EXECUTION → Proposal implemented
```

---

## Fee Structure

### Platform Fees

#### Transaction Fees
```
Primary Market (Initial Property Sale):
- Platform Fee: 2.5% of purchase price
- Example: $500 share → $12.50 fee

Secondary Market (Marketplace Trading):
- Seller Fee: 1.5% of sale price
- Buyer Fee: 0.5% of purchase price
- Example: $550 share → $8.25 seller, $2.75 buyer
```

#### Revenue Share Fees
```
Rental Income Distribution:
- Platform Fee: 2.5% of net rental income
- Property Management: 8% (to property manager)
- Maintenance Reserve: 5% (held in escrow)

Example on $3,500 monthly rent:
- Platform: $87.50
- Property Manager: $280
- Maintenance: $175
- To Shareholders: $2,957.50
```

#### Property Sale Fees
```
Capital Gains Distribution:
- Platform Fee: 2.5% of net proceeds
- Real Estate Agent: 5-6% (standard market rate)
- Closing Costs: 2-3% (title, escrow, legal)

Example on $75,000 gain:
- Platform: $1,875
- To Shareholders: $73,125
```

### Fee Comparison vs Traditional Real Estate
```
Traditional Real Estate Investment:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Purchase: $500,000 property
- Down Payment (20%): $100,000
- Closing Costs (3%): $15,000
- Agent Fees (3%): $15,000
- Total Upfront: $130,000
Annual Costs:
- Property Tax: $6,000
- Insurance: $2,000
- Maintenance: $5,000
- Property Management: $3,360
- Total Annual: $16,360

MAK Platform:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Purchase: $500 (1 share)
- Platform Fee (2.5%): $12.50
- Total Upfront: $512.50
Annual Costs:
- Platform Fees: $8.87 (on rental income)
- All other costs covered by property revenue
- Total Annual: $8.87

Savings: 99%+ reduction in entry barriers
```

---

## Marketplace Economics

### Liquidity Mechanics

**Order Book Model**:
```
Buy Orders (Bids):          Sell Orders (Asks):
━━━━━━━━━━━━━━━━━━━━━━      ━━━━━━━━━━━━━━━━━━━━━━
Price    Shares             Price    Shares
$490     25                 $510     30
$485     50                 $515     45
$480     100                $520     60
                           
Last Trade: $505
Spread: $20 (3.96%)
```

### Price Discovery

Market prices are determined by:

1. **Supply & Demand**: Active buy/sell orders
2. **Property Performance**: Rental income, occupancy
3. **Market Conditions**: Local real estate trends
4. **Comparable Sales**: Similar properties on platform

### Liquidity Incentives

**Market Maker Program** (Future):
```
Liquidity Providers Earn:
- Trading fee rebates (50% of fees)
- MAK token rewards
- Priority access to new properties

Requirements:
- Maintain active orders within 5% of market price
- Minimum $10,000 liquidity provided
- 30-day commitment period
```

---

## Economic Security

### Anti-Manipulation Measures

#### 1. Wash Trading Prevention
```solidity
// Prevent self-trading
require(buyer != seller, "Cannot buy from yourself");

// Track trading patterns
if (suspiciousActivity(buyer, seller)) {
    flagForReview();
}
```

#### 2. Price Manipulation Protection
```
Circuit Breakers:
- 10% price movement = 1-hour trading pause
- 20% price movement = 24-hour trading pause
- Manual review triggered
```

#### 3. Whale Protection
```
Maximum Position Limits:
- Single investor: 25% of property shares
- Single transaction: 10% of total shares
- Daily volume cap: 50% of outstanding shares
```

### Reserve Requirements

**Liquidity Reserve**: 10% of TVL
- Covers emergency withdrawals
- Backstops market liquidity
- Protects against smart contract risks

**Maintenance Reserve**: 5% of rental income
- Property repairs
- Vacancy coverage
- Insurance deductibles

---

## Token Economics Summary

### Value Accrual Mechanisms

**Property Tokens**:
1. Rental income distributions (monthly)
2. Property appreciation (on sale)
3. Trading profits (marketplace)

**Governance Tokens** (Future):
1. Fee sharing from platform revenue
2. Staking rewards
3. Governance rights value
4. Liquidity mining incentives

### Long-Term Sustainability

**Revenue Streams**:
```
Platform Revenue Sources:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Transaction Fees: 40%
2. Rental Income Share: 35%
3. Property Management: 15%
4. API/Data Licensing: 10%

Revenue Allocation:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Development & Operations: 50%
- Marketing & Growth: 20%
- Security & Compliance: 15%
- Community Treasury: 15%
```

### Risk Mitigation

1. **Diversification**: Multiple properties across markets
2. **Insurance**: $10M platform insurance coverage
3. **Legal Structure**: SPV per property for liability protection
4. **Reserves**: 10% liquidity + 5% maintenance reserves
5. **Audits**: Quarterly financial and annual smart contract audits

---

## Projected Growth Model

### 3-Year Projection
```
Year 1 (2025):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Properties: 50
Total Value: $25M
Active Users: 5,000
Monthly Revenue: $50K

Year 2 (2026):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Properties: 250
Total Value: $150M
Active Users: 25,000
Monthly Revenue: $300K

Year 3 (2027):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Properties: 1,000
Total Value: $750M
Active Users: 100,000
Monthly Revenue: $1.5M
```

---

## Compliance & Regulations

### Securities Compliance

**Regulatory Framework**:
- Property tokens treated as securities
- Full SEC Reg D or Reg CF compliance
- KYC/AML for all investors
- Accredited investor verification (when required)

### Tax Implications

**For Investors**:
```
Tax Treatment:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Rental Income: Ordinary income
Capital Gains: Short/long-term capital gains
Property Expenses: Proportional deductions

Annual Tax Reporting:
- 1099-DIV for rental income
- 1099-B for trading activity
- K-1 forms (if structured as partnership)
```

---

## Future Enhancements

### Roadmap Additions

**Phase 2** (Q3 2025):
- MAK governance token launch
- Staking mechanisms
- Advanced DeFi integrations

**Phase 3** (Q4 2025):
- Cross-chain bridges (Polygon, Arbitrum)
- Fractional NFT properties
- Yield farming opportunities

**Phase 4** (2026):
- DAO treasury management
- International property expansion
- Institutional investment products

---

## Support & Resources

### Documentation
- **Tokenomics Calculator**: [Coming Soon]
- **Revenue Simulator**: [Coming Soon]
- **Governance Forum**: [Coming Soon]

### Contact
- **Email**: andrewk529@protonmail.com
- **GitHub**: [github.com/andrewk529/mak-platform](https://github.com/andrewk529/mak-platform)

---

**Last Updated**: October 2025  
**Version**: 1.0.0

*This document represents the current token model and may be updated through governance proposals.*
