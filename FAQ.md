# Frequently Asked Questions (FAQ)

Common questions about MAK Platform - blockchain-powered real estate investment.

---

## Table of Contents

- [General Questions](#general-questions)
- [For Investors](#for-investors)
- [For Developers](#for-developers)
- [Technical Questions](#technical-questions)
- [Security & Legal](#security--legal)

---

## General Questions

### What is MAK Platform?

MAK Platform is a blockchain-powered real estate investment platform that enables fractional property ownership through tokenization. It allows investors to buy shares of premium real estate starting from as little as $100, earn rental income, and trade shares 24/7 on a decentralized marketplace.

### How does fractional ownership work?

Each property is tokenized into shares using ERC-1155 tokens on the Ethereum blockchain. When you purchase shares, you own a percentage of the property and receive:
- Proportional rental income (distributed monthly)
- Proportional capital appreciation (when property is sold)
- Voting rights on property decisions

### Who is behind MAK Platform?

MAK Platform is founded by a triple-licensed real estate professional with:
- Real Estate Broker License
- DMV Professional License
- Insurance Professional License
- 15+ years of traditional real estate experience

### Is this legal?

Yes. MAK Platform operates under proper licensing and complies with all applicable real estate and securities regulations. Property tokens are treated as securities and follow SEC regulations (Reg D or Reg CF).

---

## For Investors

### How much do I need to start investing?

You can start with as little as $100 worth of cryptocurrency (ETH). This makes premium real estate investment accessible to everyone.

### What returns can I expect?

Returns come from two sources:
1. **Rental Income**: Typically 4-8% annual yield, distributed monthly
2. **Property Appreciation**: Historical real estate appreciation of 3-5% annually

**Example**: A $10,000 investment could generate:
- Rental income: $400-$800/year
- Appreciation: $300-$500/year
- **Total**: $700-$1,300/year (7-13% total return)

*Past performance does not guarantee future results.*

### How do I receive rental income?

Rental income is automatically distributed to your crypto wallet monthly through smart contracts. You can:
- Claim anytime through the platform
- Reinvest into more properties
- Withdraw to your bank account

### Can I sell my shares anytime?

Yes! Unlike traditional real estate which takes 6+ months to sell, you can list your shares on our marketplace and sell 24/7. Typical sale times:
- High-demand properties: Minutes to hours
- Standard properties: Days to weeks

### What fees do you charge?

**Transaction Fees**:
- Initial purchase: 2.5% platform fee
- Marketplace trading: 1.5% seller fee, 0.5% buyer fee

**Ongoing Fees**:
- Platform fee: 2.5% of rental income
- Property management: 8% (to property manager)
- Maintenance reserve: 5% (held for repairs)

### Are my investments insured?

Yes. The platform maintains:
- $10M insurance coverage
- Property-level insurance
- Smart contract audit insurance
- Investor protection fund

### What happens if a property becomes vacant?

- Maintenance reserve covers short-term vacancies
- Property manager finds new tenants quickly
- Diversification across multiple properties reduces impact
- You can see occupancy rates before investing

### Can I invest from outside the US?

Currently launching in:
- United States ✅
- United Kingdom ✅
- Canada ✅
- Australia ✅

More countries being added based on regulatory approval. Check the platform for current availability.

### Do I pay taxes on rental income?

Yes. Rental income is taxable as ordinary income. You'll receive:
- 1099-DIV for rental distributions
- 1099-B for trading activity
- K-1 forms (if applicable)

We recommend consulting a tax professional for your specific situation.

---

## For Developers

### Is the code open source?

Yes! MAK Platform is fully open source under the MIT License. You can:
- View all code on GitHub
- Submit pull requests
- Build integrations
- Fork for your own projects

### What blockchain does it use?

**Primary**: Ethereum mainnet  
**Testnet**: Sepolia  
**Future**: Polygon, Arbitrum (Q3 2025)

### What smart contract standard?

We use **ERC-1155** (multi-token standard) for property tokens because:
- Gas efficient for multiple properties
- Supports fractional shares
- Battle-tested and secure
- Compatible with all major wallets

### How can I integrate with MAK Platform?

We provide:
- Complete API documentation
- Smart contract ABIs
- Web3 integration examples
- Developer sandbox
- Technical support

See [API_REFERENCE.md](docs/API_REFERENCE.md) for details.

### Can I build on top of MAK Platform?

Absolutely! Developers can:
- Create custom dashboards
- Build analytics tools
- Develop trading bots
- Integrate with DeFi protocols
- Create white-label solutions

Contact us for partnership opportunities.

### How do I run a local development environment?
```bash
# Clone repository
git clone https://github.com/andrewk529/mak-platform.git
cd mak-platform

# Install dependencies
npm install

# Start local blockchain
npx hardhat node

# Deploy contracts
npx hardhat run scripts/deploy.js --network localhost

# Run tests
npx hardhat test

# Start frontend
npm start
```

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for complete setup guide.

---

## Technical Questions

### How secure are the smart contracts?

Our contracts are:
- Audited by leading security firms
- Based on OpenZeppelin standards
- Tested with 100+ test cases
- Protected with multi-sig wallets
- Upgradeable through governance

### What happens if there's a bug?

We have multiple safety measures:
- Emergency pause functionality
- Multi-signature controls
- Bug bounty program
- Insurance coverage
- Timelock for upgrades

### How does the oracle get property data?

The PropertyOracle contract integrates with:
- MLS (Multiple Listing Service) APIs
- Zillow/Redfin data feeds
- County assessor records
- Professional appraisals
- On-chain verification

### Can the platform be hacked?

While no system is 100% secure, we have extensive protection:
- Regular security audits
- Penetration testing
- Multi-sig wallets (2-of-3 minimum)
- Rate limiting
- DDoS protection
- Cold storage for funds

### What if Ethereum fees are too high?

We're implementing:
- Layer 2 solutions (Polygon, Arbitrum)
- Batch transactions to reduce costs
- Gas optimization in contracts
- Alternative payment options

### How decentralized is the platform?

Current state:
- Smart contracts: Fully decentralized ✅
- Trading: Decentralized ✅
- Governance: DAO-based (Q4 2025) 🔄
- Property management: Hybrid 🔄

We're progressively decentralizing all operations.

---

## Security & Legal

### Is MAK Platform SEC compliant?

Yes. We comply with:
- Regulation D (accredited investors)
- Regulation CF (crowdfunding)
- KYC/AML requirements
- Securities registration

### Do I need to be an accredited investor?

Depends on the property:
- **Reg CF properties**: No accreditation required (up to $5,000)
- **Reg D properties**: Accredited investors only

Accredited investor requirements:
- Income > $200k/year (individual) or $300k (joint)
- Net worth > $1M (excluding primary residence)

### How is my personal data protected?

We follow strict privacy standards:
- GDPR compliant (EU)
- CCPA compliant (California)
- Encrypted data storage
- No data selling
- Minimal data collection

### What are the risks?

**Investment Risks**:
- Property value may decrease
- Rental income may fluctuate
- Vacancies reduce returns
- Market conditions change
- Liquidity may be limited

**Platform Risks**:
- Smart contract bugs
- Regulatory changes
- Technical failures
- Market volatility

**Mitigation**:
- Diversify across properties
- Invest only what you can afford
- Review property details carefully
- Understand all risks

### Can the platform freeze my funds?

Smart contracts are designed to be trustless, but:
- Emergency pause can stop trading temporarily
- Governance can make changes (with timelock)
- You always control your wallet
- No central custody of tokens

### What if the platform shuts down?

Your property tokens are stored in YOUR wallet, not ours. Even if the platform website goes offline:
- You still own your tokens
- Rental income still distributes
- Tokens are tradeable on-chain
- Smart contracts keep running

---

## Support

### Still have questions?

- **Email**: andrewk529@protonmail.com
- **GitHub Issues**: [Report here](https://github.com/andrewk529/mak-platform/issues)
- **Discord**: [Join community](https://discord.gg/makplatform) (Coming Soon)
- **Documentation**: [View docs](docs/)

### Found an issue?

Report bugs or security issues:
- **General bugs**: GitHub Issues
- **Security issues**: andrewk529@protonmail.com (confidential)
- **Bug bounty**: Up to $10,000 for critical vulnerabilities

---

## Updates

This FAQ is regularly updated. Last update: January 2025

**Didn't find your answer?** [Open an issue](https://github.com/andrewk529/mak-platform/issues/new) and we'll add it!

---

*Disclaimer: This FAQ is for informational purposes only and does not constitute investment advice. All investments carry risk. Consult with financial and legal advisors before making investment decisions.*
