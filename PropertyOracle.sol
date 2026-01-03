// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title PropertyOracle
 * @dev Bridge between real-world property data and blockchain
 * @notice Provides verified property valuations and rental income data
 */
contract PropertyOracle is AccessControl, Pausable {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    struct PropertyValuation {
        uint256 appraisedValue;        // Property value in USD (scaled by 1e8)
        uint256 appraisalDate;         // Timestamp of appraisal
        address appraiser;             // Address of certified appraiser
        string dataSource;             // MLS, Zillow, professional appraiser, etc.
        bool isVerified;               // Verification status
        uint256 confidenceScore;       // 0-100 confidence in valuation
    }

    struct RentalData {
        uint256 monthlyRent;           // Monthly rental income (USD, scaled by 1e8)
        uint256 lastUpdated;           // Last update timestamp
        uint256 occupancyRate;         // 0-100 (percentage)
        bool isVerified;               // Verification status
        address verifier;              // Who verified this data
    }

    struct PropertyMetrics {
        uint256 totalRentalIncome;     // Lifetime rental income
        uint256 lastRentalPayment;     // Last payment timestamp
        uint256 averageMonthlyRent;    // Rolling average
        uint256 valuationChangePct;    // % change from initial valuation
    }

    // PropertyId => latest valuation
    mapping(uint256 => PropertyValuation) public propertyValuations;
    
    // PropertyId => array of historical valuations
    mapping(uint256 => PropertyValuation[]) public valuationHistory;
    
    // PropertyId => rental data
    mapping(uint256 => RentalData) public rentalData;
    
    // PropertyId => metrics
    mapping(uint256 => PropertyMetrics) public propertyMetrics;
    
    // Approved data sources
    mapping(string => bool) public approvedDataSources;
    
    // Certified appraisers
    mapping(address => bool) public certifiedAppraisers;

    // USD/ETH price feed (simplified - in production use Chainlink)
    uint256 public usdEthPrice; // USD per ETH (scaled by 1e8)
    
    // Minimum time between valuations
    uint256 public constant MIN_VALUATION_INTERVAL = 30 days;
    
    // Maximum allowed confidence score
    uint256 public constant MAX_CONFIDENCE_SCORE = 100;

    event PropertyValuationUpdated(
        uint256 indexed propertyId,
        uint256 appraisedValue,
        string dataSource,
        address indexed appraiser
    );

    event RentalDataUpdated(
        uint256 indexed propertyId,
        uint256 monthlyRent,
        uint256 occupancyRate
    );

    event DataSourceApproved(string dataSource, bool approved);
    event AppraiserCertified(address indexed appraiser, bool certified);
    event UsdEthPriceUpdated(uint256 newPrice, uint256 timestamp);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(ORACLE_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        
        // Initialize with some approved data sources
        approvedDataSources["MLS"] = true;
        approvedDataSources["ZILLOW"] = true;
        approvedDataSources["REDFIN"] = true;
        approvedDataSources["PROFESSIONAL_APPRAISER"] = true;
        
        // Default USD/ETH price (example: $2000 per ETH)
        usdEthPrice = 2000 * 1e8;
    }

    /**
     * @dev Update property valuation
     * @param _propertyId ID of the property
     * @param _appraisedValue Property value in USD (scaled by 1e8)
     * @param _dataSource Source of the valuation data
     * @param _confidenceScore Confidence score (0-100)
     */
    function updatePropertyValuation(
        uint256 _propertyId,
        uint256 _appraisedValue,
        string memory _dataSource,
        uint256 _confidenceScore
    ) external onlyRole(ORACLE_ROLE) whenNotPaused {
        require(_appraisedValue > 0, "Valuation must be greater than zero");
        require(approvedDataSources[_dataSource], "Data source not approved");
        require(_confidenceScore <= MAX_CONFIDENCE_SCORE, "Invalid confidence score");
        
        PropertyValuation memory currentValuation = propertyValuations[_propertyId];
        
        // Enforce minimum interval between valuations (unless first valuation)
        if (currentValuation.appraisalDate > 0) {
            require(
                block.timestamp >= currentValuation.appraisalDate + MIN_VALUATION_INTERVAL,
                "Valuation interval not met"
            );
        }

        PropertyValuation memory newValuation = PropertyValuation({
            appraisedValue: _appraisedValue,
            appraisalDate: block.timestamp,
            appraiser: msg.sender,
            dataSource: _dataSource,
            isVerified: certifiedAppraisers[msg.sender],
            confidenceScore: _confidenceScore
        });

        // Update current valuation
        propertyValuations[_propertyId] = newValuation;
        
        // Add to history
        valuationHistory[_propertyId].push(newValuation);
        
        // Update metrics if this isn't the first valuation
        if (currentValuation.appraisalDate > 0) {
            PropertyMetrics storage metrics = propertyMetrics[_propertyId];
            int256 change = int256(_appraisedValue) - int256(currentValuation.appraisedValue);
            metrics.valuationChangePct = uint256((change * 10000) / int256(currentValuation.appraisedValue));
        }

        emit PropertyValuationUpdated(_propertyId, _appraisedValue, _dataSource, msg.sender);
    }

    /**
     * @dev Update rental data for a property
     * @param _propertyId ID of the property
     * @param _monthlyRent Monthly rent in USD (scaled by 1e8)
     * @param _occupancyRate Occupancy rate (0-100)
     */
    function updateRentalData(
        uint256 _propertyId,
        uint256 _monthlyRent,
        uint256 _occupancyRate
    ) external onlyRole(ORACLE_ROLE) whenNotPaused {
        require(_monthlyRent > 0, "Monthly rent must be greater than zero");
        require(_occupancyRate <= 100, "Invalid occupancy rate");

        RentalData storage rental = rentalData[_propertyId];
        
        rental.monthlyRent = _monthlyRent;
        rental.lastUpdated = block.timestamp;
        rental.occupancyRate = _occupancyRate;
        rental.verifier = msg.sender;
        rental.isVerified = hasRole(VERIFIER_ROLE, msg.sender);
        
        // Update metrics
        PropertyMetrics storage metrics = propertyMetrics[_propertyId];
        metrics.lastRentalPayment = block.timestamp;
        
        // Update rolling average (simplified)
        if (metrics.averageMonthlyRent == 0) {
            metrics.averageMonthlyRent = _monthlyRent;
        } else {
            // Weighted average: 80% old, 20% new
            metrics.averageMonthlyRent = (metrics.averageMonthlyRent * 80 + _monthlyRent * 20) / 100;
        }

        emit RentalDataUpdated(_propertyId, _monthlyRent, _occupancyRate);
    }

    /**
     * @dev Verify rental income payment
     * @param _propertyId ID of the property
     * @param _amount Amount received
     */
    function verifyRentalIncome(uint256 _propertyId, uint256 _amount)
        external
        onlyRole(VERIFIER_ROLE)
        whenNotPaused
        returns (bool)
    {
        require(_amount > 0, "Amount must be greater than zero");
        
        PropertyMetrics storage metrics = propertyMetrics[_propertyId];
        metrics.totalRentalIncome += _amount;
        metrics.lastRentalPayment = block.timestamp;
        
        return true;
    }

    /**
     * @dev Get property valuation in ETH
     * @param _propertyId ID of the property
     * @return Value in ETH (wei)
     */
    function getPropertyValueInEth(uint256 _propertyId)
        external
        view
        returns (uint256)
    {
        PropertyValuation memory valuation = propertyValuations[_propertyId];
        require(valuation.appraisedValue > 0, "No valuation available");
        
        // Convert USD to ETH
        // valuationUSD (1e8) / usdEthPrice (1e8) = ETH (1e18 adjustment)
        return (valuation.appraisedValue * 1e18) / usdEthPrice;
    }

    /**
     * @dev Get monthly rent in ETH
     * @param _propertyId ID of the property
     * @return Rent in ETH (wei)
     */
    function getMonthlyRentInEth(uint256 _propertyId)
        external
        view
        returns (uint256)
    {
        RentalData memory rental = rentalData[_propertyId];
        require(rental.monthlyRent > 0, "No rental data available");
        
        // Adjust for occupancy rate
        uint256 effectiveRent = (rental.monthlyRent * rental.occupancyRate) / 100;
        
        // Convert USD to ETH
        return (effectiveRent * 1e18) / usdEthPrice;
    }

    /**
     * @dev Get valuation history for a property
     * @param _propertyId ID of the property
     */
    function getValuationHistory(uint256 _propertyId)
        external
        view
        returns (PropertyValuation[] memory)
    {
        return valuationHistory[_propertyId];
    }

    /**
     * @dev Calculate cap rate (rental yield)
     * @param _propertyId ID of the property
     * @return Cap rate (scaled by 100, e.g., 550 = 5.5%)
     */
    function getCapRate(uint256 _propertyId)
        external
        view
        returns (uint256)
    {
        PropertyValuation memory valuation = propertyValuations[_propertyId];
        RentalData memory rental = rentalData[_propertyId];
        
        require(valuation.appraisedValue > 0, "No valuation available");
        require(rental.monthlyRent > 0, "No rental data available");
        
        // Annual rent / property value * 10000 (for percentage with 2 decimals)
        uint256 annualRent = rental.monthlyRent * 12;
        return (annualRent * 10000) / valuation.appraisedValue;
    }

    /**
     * @dev Update USD/ETH price (admin only)
     * @param _newPrice New price (USD per ETH, scaled by 1e8)
     */
    function updateUsdEthPrice(uint256 _newPrice)
        external
        onlyRole(ADMIN_ROLE)
    {
        require(_newPrice > 0, "Price must be greater than zero");
        
        usdEthPrice = _newPrice;
        
        emit UsdEthPriceUpdated(_newPrice, block.timestamp);
    }

    /**
     * @dev Approve/revoke data source
     * @param _dataSource Name of the data source
     * @param _approved Approval status
     */
    function setDataSourceApproval(string memory _dataSource, bool _approved)
        external
        onlyRole(ADMIN_ROLE)
    {
        approvedDataSources[_dataSource] = _approved;
        
        emit DataSourceApproved(_dataSource, _approved);
    }

    /**
     * @dev Certify/revoke appraiser
     * @param _appraiser Address of the appraiser
     * @param _certified Certification status
     */
    function setAppraiserCertification(address _appraiser, bool _certified)
        external
        onlyRole(ADMIN_ROLE)
    {
        require(_appraiser != address(0), "Invalid appraiser address");
        
        certifiedAppraisers[_appraiser] = _certified;
        
        emit AppraiserCertified(_appraiser, _certified);
    }

    /**
     * @dev Get comprehensive property data
     * @param _propertyId ID of the property
     */
    function getPropertyData(uint256 _propertyId)
        external
        view
        returns (
            PropertyValuation memory valuation,
            RentalData memory rental,
            PropertyMetrics memory metrics
        )
    {
        return (
            propertyValuations[_propertyId],
            rentalData[_propertyId],
            propertyMetrics[_propertyId]
        );
    }

    /**
     * @dev Pause the contract
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }
}
