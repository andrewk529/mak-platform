// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title PropertyToken
 * @dev ERC1155 token representing fractional ownership of real estate properties
 * @notice This is a simplified implementation for testing and development
 */
contract PropertyToken is ERC1155, AccessControl, Pausable, ReentrancyGuard {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    struct Property {
        string propertyAddress;
        uint256 totalShares;
        uint256 sharesSold;
        uint256 sharePrice;
        uint256 rentalIncome;
        bool isActive;
        address originalOwner;
        uint256 listingDate;
    }

    uint256 private _propertyIdCounter;
    mapping(uint256 => Property) public properties;
    mapping(uint256 => string) public propertyMetadata;

    event PropertyTokenized(
        uint256 indexed propertyId,
        string propertyAddress,
        uint256 totalShares,
        uint256 sharePrice
    );

    event SharePurchased(
        uint256 indexed propertyId,
        address indexed buyer,
        uint256 amount,
        uint256 totalCost
    );

    constructor() ERC1155("https://makplatform.com/api/property/{id}.json") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _propertyIdCounter = 0;
    }

    /**
     * @dev Tokenize a new property
     * @param _propertyAddress Physical address of the property
     * @param _totalShares Total number of fractional shares
     * @param _sharePrice Price per share in wei
     * @param _metadataURI IPFS URI for property metadata
     * @return propertyId The ID of the newly tokenized property
     */
    function tokenizeProperty(
        string memory _propertyAddress,
        uint256 _totalShares,
        uint256 _sharePrice,
        string memory _metadataURI
    ) external onlyRole(MINTER_ROLE) returns (uint256) {
        require(_totalShares > 0, "Total shares must be greater than zero");
        require(_sharePrice > 0, "Share price must be greater than zero");
        require(bytes(_propertyAddress).length > 0, "Property address cannot be empty");

        _propertyIdCounter++;
        uint256 propertyId = _propertyIdCounter;

        properties[propertyId] = Property({
            propertyAddress: _propertyAddress,
            totalShares: _totalShares,
            sharesSold: 0,
            sharePrice: _sharePrice,
            rentalIncome: 0,
            isActive: true,
            originalOwner: msg.sender,
            listingDate: block.timestamp
        });

        propertyMetadata[propertyId] = _metadataURI;

        emit PropertyTokenized(propertyId, _propertyAddress, _totalShares, _sharePrice);

        return propertyId;
    }

    /**
     * @dev Purchase shares of a property
     * @param _propertyId ID of the property
     * @param _shareAmount Number of shares to purchase
     */
    function purchaseShares(uint256 _propertyId, uint256 _shareAmount)
        external
        payable
        whenNotPaused
        nonReentrant
    {
        require(_propertyId > 0 && _propertyId <= _propertyIdCounter, "Property does not exist");
        require(_shareAmount > 0, "Must purchase at least one share");

        Property storage property = properties[_propertyId];
        require(property.isActive, "Property is not active");
        require(
            property.sharesSold + _shareAmount <= property.totalShares,
            "Not enough shares available"
        );

        uint256 totalCost = property.sharePrice * _shareAmount;
        require(msg.value >= totalCost, "Insufficient payment");

        // Update shares sold
        property.sharesSold += _shareAmount;

        // Mint tokens to buyer
        _mint(msg.sender, _propertyId, _shareAmount, "");

        // Refund excess payment
        if (msg.value > totalCost) {
            payable(msg.sender).transfer(msg.value - totalCost);
        }

        emit SharePurchased(_propertyId, msg.sender, _shareAmount, totalCost);
    }

    /**
     * @dev Pause the contract (emergency use only)
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

    /**
     * @dev Get property details
     * @param _propertyId ID of the property
     * @return Property struct
     */
    function getProperty(uint256 _propertyId) external view returns (Property memory) {
        require(_propertyId > 0 && _propertyId <= _propertyIdCounter, "Property does not exist");
        return properties[_propertyId];
    }

    /**
     * @dev Get total number of properties
     */
    function getTotalProperties() external view returns (uint256) {
        return _propertyIdCounter;
    }

    /**
     * @dev Returns the owner of the contract (for compatibility)
     */
    function owner() external view returns (address) {
        return getRoleMember(DEFAULT_ADMIN_ROLE, 0);
    }

    // Required overrides
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal override whenNotPaused {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }
}
