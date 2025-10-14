// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";

/**
 * @title PropertyToken
 * @notice ERC-1155 token contract for fractional real estate ownership
 * @dev Each token ID represents a unique property with divisible shares
 */
contract PropertyToken is 
    ERC1155, 
    AccessControl, 
    Pausable, 
    ReentrancyGuard,
    ERC1155Supply 
{
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant PROPERTY_MANAGER_ROLE = keccak256("PROPERTY_MANAGER_ROLE");

    struct Property {
        string propertyAddress;
        uint256 totalShares;
        uint256 pricePerShare;
        bool isActive;
        bool isVerified;
        uint256 listingDate;
        uint256 propertyValue;
        uint256 monthlyRent;
    }

    mapping(uint256 => Property) public properties;
    uint256 public propertyCount;
    string private _baseURI;
    uint256 public platformFee = 250;
    uint256 public constant MAX_PLATFORM_FEE = 500;

    event PropertyCreated(uint256 indexed propertyId, string propertyAddress, uint256 totalShares, uint256 pricePerShare, uint256 propertyValue);
    event PropertyVerified(uint256 indexed propertyId, address indexed verifier);
    event PropertyActivated(uint256 indexed propertyId);
    event PropertyDeactivated(uint256 indexed propertyId);
    event SharesMinted(uint256 indexed propertyId, address indexed to, uint256 amount);
    event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);
    event BaseURIUpdated(string oldURI, string newURI);

    error InvalidPropertyId();
    error PropertyNotActive();
    error PropertyNotVerified();
    error InvalidShareAmount();
    error InvalidPrice();
    error PropertyAlreadyExists();
    error ExceedsMaxSupply();
    error FeeTooHigh();
    error EmptyAddress();
    error InvalidPropertyValue();

    constructor(string memory baseURI_) ERC1155(baseURI_) {
        _baseURI = baseURI_;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(PROPERTY_MANAGER_ROLE, msg.sender);
    }

    function createProperty(
        string memory propertyAddress_,
        uint256 totalShares_,
        uint256 pricePerShare_,
        uint256 propertyValue_,
        uint256 monthlyRent_
    ) external onlyRole(PROPERTY_MANAGER_ROLE) returns (uint256) {
        if (totalShares_ == 0) revert InvalidShareAmount();
        if (pricePerShare_ == 0) revert InvalidPrice();
        if (propertyValue_ == 0) revert InvalidPropertyValue();
        if (bytes(propertyAddress_).length == 0) revert EmptyAddress();

        uint256 propertyId = propertyCount++;
        properties[propertyId] = Property({
            propertyAddress: propertyAddress_,
            totalShares: totalShares_,
            pricePerShare: pricePerShare_,
            isActive: false,
            isVerified: false,
            listingDate: block.timestamp,
            propertyValue: propertyValue_,
            monthlyRent: monthlyRent_
        });

        emit PropertyCreated(propertyId, propertyAddress_, totalShares_, pricePerShare_, propertyValue_);
        return propertyId;
    }

    function verifyProperty(uint256 propertyId) external onlyRole(PROPERTY_MANAGER_ROLE) {
        if (propertyId >= propertyCount) revert InvalidPropertyId();
        properties[propertyId].isVerified = true;
        emit PropertyVerified(propertyId, msg.sender);
    }

    function activateProperty(uint256 propertyId) external onlyRole(PROPERTY_MANAGER_ROLE) {
        if (propertyId >= propertyCount) revert InvalidPropertyId();
        if (!properties[propertyId].isVerified) revert PropertyNotVerified();
        properties[propertyId].isActive = true;
        emit PropertyActivated(propertyId);
    }

    function deactivateProperty(uint256 propertyId) external onlyRole(PROPERTY_MANAGER_ROLE) {
        if (propertyId >= propertyCount) revert InvalidPropertyId();
        properties[propertyId].isActive = false;
        emit PropertyDeactivated(propertyId);
    }

    function mintShares(address to, uint256 propertyId, uint256 amount) external onlyRole(MINTER_ROLE) nonReentrant {
        if (to == address(0)) revert EmptyAddress();
        if (propertyId >= propertyCount) revert InvalidPropertyId();
        if (amount == 0) revert InvalidShareAmount();
        
        Property memory property = properties[propertyId];
        if (totalSupply(propertyId) + amount > property.totalShares) revert ExceedsMaxSupply();

        _mint(to, propertyId, amount, "");
        emit SharesMinted(propertyId, to, amount);
    }

    function mintBatch(address to, uint256[] memory propertyIds, uint256[] memory amounts) external onlyRole(MINTER_ROLE) nonReentrant {
        if (to == address(0)) revert EmptyAddress();
        for (uint256 i = 0; i < propertyIds.length; i++) {
            if (propertyIds[i] >= propertyCount) revert InvalidPropertyId();
            Property memory property = properties[propertyIds[i]];
            if (totalSupply(propertyIds[i]) + amounts[i] > property.totalShares) revert ExceedsMaxSupply();
        }
        _mintBatch(to, propertyIds, amounts, "");
    }

    function getProperty(uint256 propertyId) external view returns (Property memory) {
        if (propertyId >= propertyCount) revert InvalidPropertyId();
        return properties[propertyId];
    }

    function getProperties(uint256[] memory propertyIds) external view returns (Property[] memory) {
        Property[] memory props = new Property[](propertyIds.length);
        for (uint256 i = 0; i < propertyIds.length; i++) {
            if (propertyIds[i] < propertyCount) {
                props[i] = properties[propertyIds[i]];
            }
        }
        return props;
    }

    function getActiveProperties() external view returns (uint256[] memory) {
        uint256 activeCount = 0;
        for (uint256 i = 0; i < propertyCount; i++) {
            if (properties[i].isActive) activeCount++;
        }
        
        uint256[] memory activeProps = new uint256[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i < propertyCount; i++) {
            if (properties[i].isActive) {
                activeProps[index] = i;
                index++;
            }
        }
        return activeProps;
    }

    function isPropertyTradeable(uint256 propertyId) external view returns (bool) {
        if (propertyId >= propertyCount) return false;
        return properties[propertyId].isActive && properties[propertyId].isVerified;
    }

    function setPlatformFee(uint256 newFee) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (newFee > MAX_PLATFORM_FEE) revert FeeTooHigh();
        uint256 oldFee = platformFee;
        platformFee = newFee;
        emit PlatformFeeUpdated(oldFee, newFee);
    }

    function setBaseURI(string memory newURI) external onlyRole(DEFAULT_ADMIN_ROLE) {
        string memory oldURI = _baseURI;
        _baseURI = newURI;
        emit BaseURIUpdated(oldURI, newURI);
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function uri(uint256 tokenId) public view override returns (string memory) {
        return string(abi.encodePacked(_baseURI, "/", _toString(tokenId), ".json"));
    }

    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal override(ERC1155, ERC1155Supply) whenNotPaused {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC1155, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
