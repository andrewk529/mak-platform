// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";

/**
 * @title PropertyMarketplace
 * @notice Decentralized marketplace for trading property shares
 */
contract PropertyMarketplace is ReentrancyGuard, Pausable, AccessControl, ERC1155Holder {
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant FEE_MANAGER_ROLE = keccak256("FEE_MANAGER_ROLE");

    struct Listing {
        address seller;
        uint256 propertyId;
        uint256 shares;
        uint256 pricePerShare;
        uint256 listingTime;
        bool isActive;
    }

    IERC1155 public propertyToken;
    mapping(uint256 => Listing) public listings;
    uint256 public listingCount;
    uint256 public platformFee = 250;
    uint256 public constant MAX_PLATFORM_FEE = 1000;
    address public feeRecipient;
    uint256 public constant MIN_LISTING_DURATION = 1 hours;

    event SharesListed(uint256 indexed listingId, address indexed seller, uint256 indexed propertyId, uint256 shares, uint256 pricePerShare);
    event SharesPurchased(uint256 indexed listingId, address indexed buyer, address indexed seller, uint256 propertyId, uint256 shares, uint256 totalPrice, uint256 platformFeeAmount);
    event ListingCancelled(uint256 indexed listingId, address indexed seller, uint256 propertyId);
    event ListingUpdated(uint256 indexed listingId, uint256 newPricePerShare);
    event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);
    event FeeRecipientUpdated(address oldRecipient, address newRecipient);

    error InvalidListing();
    error InsufficientPayment();
    error InvalidShareAmount();
    error InvalidPrice();
    error NotSeller();
    error ListingNotActive();
    error FeeTooHigh();
    error InvalidFeeRecipient();
    error TransferFailed();
    error InvalidPropertyToken();

    constructor(address propertyToken_, address feeRecipient_) {
        if (propertyToken_ == address(0)) revert InvalidPropertyToken();
        if (feeRecipient_ == address(0)) revert InvalidFeeRecipient();
        propertyToken = IERC1155(propertyToken_);
        feeRecipient = feeRecipient_;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(FEE_MANAGER_ROLE, msg.sender);
    }

    function listShares(uint256 propertyId, uint256 shares, uint256 pricePerShare) external nonReentrant whenNotPaused returns (uint256) {
        if (shares == 0) revert InvalidShareAmount();
        if (pricePerShare == 0) revert InvalidPrice();
        uint256 balance = propertyToken.balanceOf(msg.sender, propertyId);
        if (balance < shares) revert InvalidShareAmount();

        propertyToken.safeTransferFrom(msg.sender, address(this), propertyId, shares, "");
        uint256 listingId = listingCount++;
        listings[listingId] = Listing({
            seller: msg.sender,
            propertyId: propertyId,
            shares: shares,
            pricePerShare: pricePerShare,
            listingTime: block.timestamp,
            isActive: true
        });

        emit SharesListed(listingId, msg.sender, propertyId, shares, pricePerShare);
        return listingId;
    }

    function purchaseShares(uint256 listingId, uint256 sharesToBuy) external payable nonReentrant whenNotPaused {
        if (listingId >= listingCount) revert InvalidListing();
        Listing storage listing = listings[listingId];
        if (!listing.isActive) revert ListingNotActive();
        if (sharesToBuy == 0 || sharesToBuy > listing.shares) revert InvalidShareAmount();

        uint256 totalPrice = sharesToBuy * listing.pricePerShare;
        uint256 feeAmount = (totalPrice * platformFee) / 10000;
        uint256 sellerAmount = totalPrice - feeAmount;
        if (msg.value < totalPrice) revert InsufficientPayment();

        listing.shares -= sharesToBuy;
        if (listing.shares == 0) listing.isActive = false;

        propertyToken.safeTransferFrom(address(this), msg.sender, listing.propertyId, sharesToBuy, "");
        (bool sellerSuccess, ) = payable(listing.seller).call{value: sellerAmount}("");
        if (!sellerSuccess) revert TransferFailed();
        (bool feeSuccess, ) = payable(feeRecipient).call{value: feeAmount}("");
        if (!feeSuccess) revert TransferFailed();

        if (msg.value > totalPrice) {
            (bool refundSuccess, ) = payable(msg.sender).call{value: msg.value - totalPrice}("");
            if (!refundSuccess) revert TransferFailed();
        }

        emit SharesPurchased(listingId, msg.sender, listing.seller, listing.propertyId, sharesToBuy, totalPrice, feeAmount);
    }

    function cancelListing(uint256 listingId) external nonReentrant whenNotPaused {
        if (listingId >= listingCount) revert InvalidListing();
        Listing storage listing = listings[listingId];
        if (listing.seller != msg.sender) revert NotSeller();
        if (!listing.isActive) revert ListingNotActive();

        uint256 sharesToReturn = listing.shares;
        uint256 propertyId = listing.propertyId;
        listing.isActive = false;
        listing.shares = 0;

        propertyToken.safeTransferFrom(address(this), msg.sender, propertyId, sharesToReturn, "");
        emit ListingCancelled(listingId, msg.sender, propertyId);
    }

    function updateListingPrice(uint256 listingId, uint256 newPricePerShare) external whenNotPaused {
        if (listingId >= listingCount) revert InvalidListing();
        if (newPricePerShare == 0) revert InvalidPrice();
        Listing storage listing = listings[listingId];
        if (listing.seller != msg.sender) revert NotSeller();
        if (!listing.isActive) revert ListingNotActive();
        listing.pricePerShare = newPricePerShare;
        emit ListingUpdated(listingId, newPricePerShare);
    }

    function getListing(uint256 listingId) external view returns (Listing memory) {
        if (listingId >= listingCount) revert InvalidListing();
        return listings[listingId];
    }

    function getActiveListingsByProperty(uint256 propertyId) external view returns (uint256[] memory) {
        uint256 activeCount = 0;
        for (uint256 i = 0; i < listingCount; i++) {
            if (listings[i].isActive && listings[i].propertyId == propertyId) activeCount++;
        }
        uint256[] memory activeListings = new uint256[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i < listingCount; i++) {
            if (listings[i].isActive && listings[i].propertyId == propertyId) {
                activeListings[index] = i;
                index++;
            }
        }
        return activeListings;
    }

    function getListingsBySeller(address seller) external view returns (uint256[] memory) {
        uint256 sellerListingCount = 0;
        for (uint256 i = 0; i < listingCount; i++) {
            if (listings[i].seller == seller && listings[i].isActive) sellerListingCount++;
        }
        uint256[] memory sellerListings = new uint256[](sellerListingCount);
        uint256 index = 0;
        for (uint256 i = 0; i < listingCount; i++) {
            if (listings[i].seller == seller && listings[i].isActive) {
                sellerListings[index] = i;
                index++;
            }
        }
        return sellerListings;
    }

    function calculatePurchasePrice(uint256 listingId, uint256 sharesToBuy) external view returns (uint256 totalPrice, uint256 feeAmount) {
        if (listingId >= listingCount) revert InvalidListing();
        Listing memory listing = listings[listingId];
        totalPrice = sharesToBuy * listing.pricePerShare;
        feeAmount = (totalPrice * platformFee) / 10000;
    }

    function setPlatformFee(uint256 newFee) external onlyRole(FEE_MANAGER_ROLE) {
        if (newFee > MAX_PLATFORM_FEE) revert FeeTooHigh();
        uint256 oldFee = platformFee;
        platformFee = newFee;
        emit PlatformFeeUpdated(oldFee, newFee);
    }

    function setFeeRecipient(address newRecipient) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (newRecipient == address(0)) revert InvalidFeeRecipient();
        address oldRecipient = feeRecipient;
        feeRecipient = newRecipient;
        emit FeeRecipientUpdated(oldRecipient, newRecipient);
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function supportsInterface(bytes4 interfaceId) public view override(AccessControl, ERC1155Holder) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
