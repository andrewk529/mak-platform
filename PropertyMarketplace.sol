// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title PropertyMarketplace
 * @dev Decentralized marketplace for trading fractional property shares
 * @notice Allows users to create buy/sell orders and trade property tokens
 */
contract PropertyMarketplace is ERC1155Holder, AccessControl, ReentrancyGuard, Pausable {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    IERC1155 public propertyToken;
    
    // Trading fee in basis points (100 = 1%)
    uint256 public tradingFeeBasisPoints = 50; // 0.5%
    uint256 public constant MAX_FEE_BASIS_POINTS = 1000; // 10% max
    uint256 public constant BASIS_POINTS = 10000;
    
    address public feeCollector;
    uint256 private _orderIdCounter;

    struct SellOrder {
        uint256 orderId;
        address seller;
        uint256 propertyId;
        uint256 shareAmount;
        uint256 pricePerShare;
        uint256 remainingShares;
        uint256 timestamp;
        bool isActive;
    }

    struct BuyOrder {
        uint256 orderId;
        address buyer;
        uint256 propertyId;
        uint256 shareAmount;
        uint256 pricePerShare;
        uint256 remainingShares;
        uint256 totalEscrow;
        uint256 timestamp;
        bool isActive;
    }

    // OrderId => SellOrder
    mapping(uint256 => SellOrder) public sellOrders;
    
    // OrderId => BuyOrder
    mapping(uint256 => BuyOrder) public buyOrders;
    
    // PropertyId => array of active sell order IDs
    mapping(uint256 => uint256[]) public propertySellOrders;
    
    // PropertyId => array of active buy order IDs
    mapping(uint256 => uint256[]) public propertyBuyOrders;

    // Track total fees collected
    uint256 public totalFeesCollected;

    event SellOrderCreated(
        uint256 indexed orderId,
        address indexed seller,
        uint256 indexed propertyId,
        uint256 shareAmount,
        uint256 pricePerShare
    );

    event BuyOrderCreated(
        uint256 indexed orderId,
        address indexed buyer,
        uint256 indexed propertyId,
        uint256 shareAmount,
        uint256 pricePerShare
    );

    event OrderExecuted(
        uint256 indexed orderId,
        address indexed buyer,
        address indexed seller,
        uint256 propertyId,
        uint256 shareAmount,
        uint256 totalPrice
    );

    event OrderCancelled(
        uint256 indexed orderId,
        address indexed creator,
        bool isSellOrder
    );

    event TradingFeeUpdated(uint256 oldFee, uint256 newFee);
    event FeeCollectorUpdated(address oldCollector, address newCollector);

    constructor(address _propertyToken, address _feeCollector) {
        require(_propertyToken != address(0), "Invalid property token address");
        require(_feeCollector != address(0), "Invalid fee collector address");
        
        propertyToken = IERC1155(_propertyToken);
        feeCollector = _feeCollector;
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        
        _orderIdCounter = 0;
    }

    /**
     * @dev Create a sell order for property shares
     * @param _propertyId ID of the property
     * @param _shareAmount Number of shares to sell
     * @param _pricePerShare Price per share in wei
     */
    function createSellOrder(
        uint256 _propertyId,
        uint256 _shareAmount,
        uint256 _pricePerShare
    ) external whenNotPaused nonReentrant returns (uint256) {
        require(_shareAmount > 0, "Share amount must be greater than zero");
        require(_pricePerShare > 0, "Price must be greater than zero");
        require(
            propertyToken.balanceOf(msg.sender, _propertyId) >= _shareAmount,
            "Insufficient share balance"
        );

        _orderIdCounter++;
        uint256 orderId = _orderIdCounter;

        // Transfer shares to marketplace (escrow)
        propertyToken.safeTransferFrom(
            msg.sender,
            address(this),
            _propertyId,
            _shareAmount,
            ""
        );

        sellOrders[orderId] = SellOrder({
            orderId: orderId,
            seller: msg.sender,
            propertyId: _propertyId,
            shareAmount: _shareAmount,
            pricePerShare: _pricePerShare,
            remainingShares: _shareAmount,
            timestamp: block.timestamp,
            isActive: true
        });

        propertySellOrders[_propertyId].push(orderId);

        emit SellOrderCreated(orderId, msg.sender, _propertyId, _shareAmount, _pricePerShare);

        return orderId;
    }

    /**
     * @dev Create a buy order for property shares with escrow
     * @param _propertyId ID of the property
     * @param _shareAmount Number of shares to buy
     * @param _pricePerShare Maximum price per share willing to pay
     */
    function createBuyOrder(
        uint256 _propertyId,
        uint256 _shareAmount,
        uint256 _pricePerShare
    ) external payable whenNotPaused nonReentrant returns (uint256) {
        require(_shareAmount > 0, "Share amount must be greater than zero");
        require(_pricePerShare > 0, "Price must be greater than zero");
        
        uint256 totalCost = _shareAmount * _pricePerShare;
        uint256 fee = (totalCost * tradingFeeBasisPoints) / BASIS_POINTS;
        uint256 totalRequired = totalCost + fee;
        
        require(msg.value >= totalRequired, "Insufficient payment");

        _orderIdCounter++;
        uint256 orderId = _orderIdCounter;

        buyOrders[orderId] = BuyOrder({
            orderId: orderId,
            buyer: msg.sender,
            propertyId: _propertyId,
            shareAmount: _shareAmount,
            pricePerShare: _pricePerShare,
            remainingShares: _shareAmount,
            totalEscrow: msg.value,
            timestamp: block.timestamp,
            isActive: true
        });

        propertyBuyOrders[_propertyId].push(orderId);

        emit BuyOrderCreated(orderId, msg.sender, _propertyId, _shareAmount, _pricePerShare);

        // Refund excess payment
        if (msg.value > totalRequired) {
            payable(msg.sender).transfer(msg.value - totalRequired);
        }

        return orderId;
    }

    /**
     * @dev Execute a sell order (buyer purchases shares)
     * @param _orderId ID of the sell order
     * @param _shareAmount Number of shares to purchase
     */
    function executeSellOrder(uint256 _orderId, uint256 _shareAmount)
        external
        payable
        whenNotPaused
        nonReentrant
    {
        SellOrder storage order = sellOrders[_orderId];
        require(order.isActive, "Order is not active");
        require(_shareAmount > 0 && _shareAmount <= order.remainingShares, "Invalid share amount");
        require(msg.sender != order.seller, "Cannot buy your own order");

        uint256 totalPrice = _shareAmount * order.pricePerShare;
        uint256 fee = (totalPrice * tradingFeeBasisPoints) / BASIS_POINTS;
        uint256 totalCost = totalPrice + fee;

        require(msg.value >= totalCost, "Insufficient payment");

        // Update order
        order.remainingShares -= _shareAmount;
        if (order.remainingShares == 0) {
            order.isActive = false;
        }

        // Transfer shares to buyer
        propertyToken.safeTransferFrom(
            address(this),
            msg.sender,
            order.propertyId,
            _shareAmount,
            ""
        );

        // Transfer payment to seller
        payable(order.seller).transfer(totalPrice);

        // Transfer fee to fee collector
        payable(feeCollector).transfer(fee);
        totalFeesCollected += fee;

        // Refund excess payment
        if (msg.value > totalCost) {
            payable(msg.sender).transfer(msg.value - totalCost);
        }

        emit OrderExecuted(_orderId, msg.sender, order.seller, order.propertyId, _shareAmount, totalPrice);
    }

    /**
     * @dev Execute a buy order (seller fills the order)
     * @param _orderId ID of the buy order
     * @param _shareAmount Number of shares to sell
     */
    function executeBuyOrder(uint256 _orderId, uint256 _shareAmount)
        external
        whenNotPaused
        nonReentrant
    {
        BuyOrder storage order = buyOrders[_orderId];
        require(order.isActive, "Order is not active");
        require(_shareAmount > 0 && _shareAmount <= order.remainingShares, "Invalid share amount");
        require(msg.sender != order.buyer, "Cannot sell to your own order");
        require(
            propertyToken.balanceOf(msg.sender, order.propertyId) >= _shareAmount,
            "Insufficient share balance"
        );

        uint256 totalPrice = _shareAmount * order.pricePerShare;
        uint256 fee = (totalPrice * tradingFeeBasisPoints) / BASIS_POINTS;

        // Update order
        order.remainingShares -= _shareAmount;
        order.totalEscrow -= (totalPrice + fee);
        
        if (order.remainingShares == 0) {
            order.isActive = false;
            // Refund any remaining escrow to buyer
            if (order.totalEscrow > 0) {
                payable(order.buyer).transfer(order.totalEscrow);
                order.totalEscrow = 0;
            }
        }

        // Transfer shares from seller to buyer
        propertyToken.safeTransferFrom(
            msg.sender,
            order.buyer,
            order.propertyId,
            _shareAmount,
            ""
        );

        // Transfer payment to seller
        payable(msg.sender).transfer(totalPrice);

        // Transfer fee to fee collector
        payable(feeCollector).transfer(fee);
        totalFeesCollected += fee;

        emit OrderExecuted(_orderId, order.buyer, msg.sender, order.propertyId, _shareAmount, totalPrice);
    }

    /**
     * @dev Cancel a sell order
     * @param _orderId ID of the order to cancel
     */
    function cancelSellOrder(uint256 _orderId) external nonReentrant {
        SellOrder storage order = sellOrders[_orderId];
        require(order.isActive, "Order is not active");
        require(msg.sender == order.seller, "Not the order creator");

        order.isActive = false;

        // Return remaining shares to seller
        if (order.remainingShares > 0) {
            propertyToken.safeTransferFrom(
                address(this),
                order.seller,
                order.propertyId,
                order.remainingShares,
                ""
            );
        }

        emit OrderCancelled(_orderId, msg.sender, true);
    }

    /**
     * @dev Cancel a buy order
     * @param _orderId ID of the order to cancel
     */
    function cancelBuyOrder(uint256 _orderId) external nonReentrant {
        BuyOrder storage order = buyOrders[_orderId];
        require(order.isActive, "Order is not active");
        require(msg.sender == order.buyer, "Not the order creator");

        order.isActive = false;

        // Refund escrow to buyer
        if (order.totalEscrow > 0) {
            uint256 refund = order.totalEscrow;
            order.totalEscrow = 0;
            payable(order.buyer).transfer(refund);
        }

        emit OrderCancelled(_orderId, msg.sender, false);
    }

    /**
     * @dev Get all active sell orders for a property
     * @param _propertyId ID of the property
     */
    function getPropertySellOrders(uint256 _propertyId)
        external
        view
        returns (uint256[] memory)
    {
        return propertySellOrders[_propertyId];
    }

    /**
     * @dev Get all active buy orders for a property
     * @param _propertyId ID of the property
     */
    function getPropertyBuyOrders(uint256 _propertyId)
        external
        view
        returns (uint256[] memory)
    {
        return propertyBuyOrders[_propertyId];
    }

    /**
     * @dev Get market price (average of active orders)
     * @param _propertyId ID of the property
     */
    function getMarketPrice(uint256 _propertyId) external view returns (uint256) {
        uint256[] memory sellOrderIds = propertySellOrders[_propertyId];
        uint256 totalPrice = 0;
        uint256 activeOrders = 0;

        for (uint256 i = 0; i < sellOrderIds.length; i++) {
            SellOrder memory order = sellOrders[sellOrderIds[i]];
            if (order.isActive && order.remainingShares > 0) {
                totalPrice += order.pricePerShare;
                activeOrders++;
            }
        }

        return activeOrders > 0 ? totalPrice / activeOrders : 0;
    }

    /**
     * @dev Update trading fee (admin only)
     * @param _newFeeBasisPoints New fee in basis points
     */
    function setTradingFee(uint256 _newFeeBasisPoints) external onlyRole(ADMIN_ROLE) {
        require(_newFeeBasisPoints <= MAX_FEE_BASIS_POINTS, "Fee too high");
        
        uint256 oldFee = tradingFeeBasisPoints;
        tradingFeeBasisPoints = _newFeeBasisPoints;
        
        emit TradingFeeUpdated(oldFee, _newFeeBasisPoints);
    }

    /**
     * @dev Update fee collector address (admin only)
     * @param _newFeeCollector New fee collector address
     */
    function setFeeCollector(address _newFeeCollector) external onlyRole(ADMIN_ROLE) {
        require(_newFeeCollector != address(0), "Invalid address");
        
        address oldCollector = feeCollector;
        feeCollector = _newFeeCollector;
        
        emit FeeCollectorUpdated(oldCollector, _newFeeCollector);
    }

    /**
     * @dev Pause the marketplace
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause the marketplace
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @dev Required for receiving ERC1155 tokens
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155Holder, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
