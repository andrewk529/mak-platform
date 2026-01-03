// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title PropertyToken
 * @dev ERC-1155 token representing fractional interests in real estate assets.
 *
 * - Each property is mapped to a tokenId (uint256).
 * - Total supply per tokenId represents 100% of the economic interest in that property.
 * - Minting/burning restricted to a platform admin (e.g. SPV / manager).
 *
 * NOTE: This is a scaffold. Fill in access control + hooks for marketplace/revenue contracts.
 */

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract PropertyToken is ERC1155, AccessControl {
    bytes32 public constant PROPERTY_ADMIN_ROLE = keccak256("PROPERTY_ADMIN_ROLE");

    // Optional: metadata per property (e.g. off-chain reference, SPV id)
    struct PropertyInfo {
        string metadataURI;     // off-chain JSON with details (address, docs, etc.)
        uint256 maxSupply;      // total fractional interests (e.g. 100_000 = 100.0000%)
        bool mintingFinalized;  // once true, no new supply can be minted
    }

    // tokenId => PropertyInfo
    mapping(uint256 => PropertyInfo) public properties;

    event PropertyCreated(uint256 indexed tokenId, string metadataURI, uint256 maxSupply);
    event PropertyFinalized(uint256 indexed tokenId);

    constructor(string memory _baseURI, address admin) ERC1155(_baseURI) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(PROPERTY_ADMIN_ROLE, admin);
    }

    // -------------------------
    // Property lifecycle
    // -------------------------

    /**
     * @dev Create a new property token type.
     * @param tokenId Unique id for this property.
     * @param metadataURI Off-chain metadata (IPFS/HTTPS JSON).
     * @param maxSupply Total fractional units (e.g. 1_000_000 = 100%).
     */
    function createProperty(
        uint256 tokenId,
        string calldata metadataURI,
        uint256 maxSupply
    ) external onlyRole(PROPERTY_ADMIN_ROLE) {
        require(maxSupply > 0, "maxSupply must be > 0");
        require(properties[tokenId].maxSupply == 0, "Property already exists");

        properties[tokenId] = PropertyInfo({
            metadataURI: metadataURI,
            maxSupply: maxSupply,
            mintingFinalized: false
        });

        emit PropertyCreated(tokenId, metadataURI, maxSupply);
    }

    /**
     * @dev Mint fractions for a given property to an investor.
     * Enforces maxSupply and optional mintingFinalized flag.
     */
    function mintFractions(
        address to,
        uint256 tokenId,
        uint256 amount,
        bytes calldata data
    ) external onlyRole(PROPERTY_ADMIN_ROLE) {
        PropertyInfo memory info = properties[tokenId];
        require(info.maxSupply > 0, "Property does not exist");
        require(!info.mintingFinalized, "Minting finalized");

        uint256 currentSupply = totalSupply(tokenId);
        require(currentSupply + amount <= info.maxSupply, "Exceeds max supply");

        _mint(to, tokenId, amount, data);
    }

    /**
     * @dev Permanently finalize minting for a property.
     * No further supply can be created.
     */
    function finalizeProperty(uint256 tokenId) external onlyRole(PROPERTY_ADMIN_ROLE) {
        require(properties[tokenId].maxSupply > 0, "Property does not exist");
        require(!properties[tokenId].mintingFinalized, "Already finalized");

        properties[tokenId].mintingFinalized = true;
        emit PropertyFinalized(tokenId);
    }

    /**
     * @dev Optional burn function for buybacks / redemptions.
     */
    function burnFractions(
        address from,
        uint256 tokenId,
        uint256 amount
    ) external {
        require(
            from == _msgSender() || isApprovedForAll(from, _msgSender()),
            "Not owner or approved"
        );
        _burn(from, tokenId, amount);
    }

    /**
     * @dev Optional: override uri to support per-token metadata if needed.
     */
    function uri(uint256 tokenId) public view override returns (string memory) {
        PropertyInfo memory info = properties[tokenId];
        if (bytes(info.metadataURI).length > 0) {
            return info.metadataURI;
        }
        return super.uri(tokenId);
    }

    // ------------- Helpers -------------

    // Simple totalSupply tracking per id
    mapping(uint256 => uint256) private _totalSupply;

    function totalSupply(uint256 id) public view returns (uint256) {
        return _totalSupply[id];
    }

    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal override {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);

        if (from == address(0)) {
            // mint
            for (uint256 i = 0; i < ids.length; i++) {
                _totalSupply[ids[i]] += amounts[i];
            }
        } else if (to == address(0)) {
            // burn
            for (uint256 i = 0; i < ids.length; i++) {
                uint256 id = ids[i];
                uint256 amount = amounts[i];
                uint256 supply = _totalSupply[id];
                require(supply >= amount, "Burn exceeds supply");
                _totalSupply[id] = supply - amount;
            }
        }
    }
}
