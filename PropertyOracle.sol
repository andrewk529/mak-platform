// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title PropertyOracle
 * @notice Oracle contract for feeding real-world property data on-chain
 */
contract PropertyOracle is AccessControl, Pausable {
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    struct Valuation {
        uint256 currentValue;
        uint256 lastUpdated;
        int256 appreciation;
        string source;
    }

    struct Occupancy {
        bool isOccupied;
        uint256 tenantCount;
        uint256 leaseEndDate;
        uint256 monthlyRent;
    }

    struct MaintenanceRecord {
        string description;
        uint256 cost;
        uint256 date;
        string category;
    }

    struct ConditionReport {
        uint8 overallScore;
        uint8 structuralScore;
        uint8 cosmeticScore;
        address inspector;
        uint256 inspectionDate;
        string notes;
    }

    mapping(uint256 => Valuation[]) public valuationHistory;
    mapping(uint256 => Occupancy) public currentOccupancy;
    mapping(uint256 => MaintenanceRecord[]) public maintenanceRecords;
    mapping(uint256 => ConditionReport[]) public conditionReports;
    mapping(uint256 => uint256) public totalMaintenanceCosts;
    uint256 public constant MIN_VALUATION_INTERVAL = 24 hours;

    event ValuationUpdated(uint256 indexed propertyId, uint256 newValue, int256 appreciation, string source);
    event OccupancyUpdated(uint256 indexed propertyId, bool isOccupied, uint256 monthlyRent);
    event MaintenanceRecorded(uint256 indexed propertyId, string description, uint256 cost, string category);
    event ConditionReportAdded(uint256 indexed propertyId, uint8 overallScore, address indexed inspector);

    error InvalidPropertyId();
    error InvalidValue();
    error InvalidScore();
    error TooSoonForUpdate();
    error InvalidDate();
    error EmptyDescription();

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ORACLE_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
    }

    function updateValuation(uint256 propertyId, uint256 newValue, string memory source) external onlyRole(ORACLE_ROLE) whenNotPaused {
        if (newValue == 0) revert InvalidValue();
        Valuation[] storage history = valuationHistory[propertyId];
        if (history.length > 0) {
            uint256 lastUpdate = history[history.length - 1].lastUpdated;
            if (block.timestamp < lastUpdate + MIN_VALUATION_INTERVAL) revert TooSoonForUpdate();
        }

        int256 appreciation = 0;
        if (history.length > 0) {
            uint256 oldValue = history[history.length - 1].currentValue;
            appreciation = int256((newValue * 10000 / oldValue)) - 10000;
        }

        history.push(Valuation({
            currentValue: newValue,
            lastUpdated: block.timestamp,
            appreciation: appreciation,
            source: source
        }));

        emit ValuationUpdated(propertyId, newValue, appreciation, source);
    }

    function getCurrentValuation(uint256 propertyId) external view returns (Valuation memory) {
        Valuation[] storage history = valuationHistory[propertyId];
        if (history.length == 0) revert InvalidPropertyId();
        return history[history.length - 1];
    }

    function getValuationHistory(uint256 propertyId) external view returns (Valuation[] memory) {
        return valuationHistory[propertyId];
    }

    function updateOccupancy(uint256 propertyId, bool isOccupied, uint256 tenantCount, uint256 leaseEndDate, uint256 monthlyRent) external onlyRole(ORACLE_ROLE) whenNotPaused {
        if (leaseEndDate > 0 && leaseEndDate < block.timestamp) revert InvalidDate();
        currentOccupancy[propertyId] = Occupancy({
            isOccupied: isOccupied,
            tenantCount: tenantCount,
            leaseEndDate: leaseEndDate,
            monthlyRent: monthlyRent
        });
        emit OccupancyUpdated(propertyId, isOccupied, monthlyRent);
    }

    function getOccupancy(uint256 propertyId) external view returns (Occupancy memory) {
        return currentOccupancy[propertyId];
    }

    function isOccupied(uint256 propertyId) external view returns (bool) {
        return currentOccupancy[propertyId].isOccupied;
    }

    function recordMaintenance(uint256 propertyId, string memory description, uint256 cost, string memory category) external onlyRole(ORACLE_ROLE) whenNotPaused {
        if (bytes(description).length == 0) revert EmptyDescription();
        maintenanceRecords[propertyId].push(MaintenanceRecord({
            description: description,
            cost: cost,
            date: block.timestamp,
            category: category
        }));
        totalMaintenanceCosts[propertyId] += cost;
        emit MaintenanceRecorded(propertyId, description, cost, category);
    }

    function getMaintenanceRecords(uint256 propertyId) external view returns (MaintenanceRecord[] memory) {
        return maintenanceRecords[propertyId];
    }

    function getTotalMaintenanceCosts(uint256 propertyId) external view returns (uint256) {
        return totalMaintenanceCosts[propertyId];
    }

    function addConditionReport(uint256 propertyId, uint8 overallScore, uint8 structuralScore, uint8 cosmeticScore, string memory notes) external onlyRole(ORACLE_ROLE) whenNotPaused {
        if (overallScore > 100 || structuralScore > 100 || cosmeticScore > 100) revert InvalidScore();
        conditionReports[propertyId].push(ConditionReport({
            overallScore: overallScore,
            structuralScore: structuralScore,
            cosmeticScore: cosmeticScore,
            inspector: msg.sender,
            inspectionDate: block.timestamp,
            notes: notes
        }));
        emit ConditionReportAdded(propertyId, overallScore, msg.sender);
    }

    function getLatestConditionReport(uint256 propertyId) external view returns (ConditionReport memory) {
        ConditionReport[] storage reports = conditionReports[propertyId];
        if (reports.length == 0) revert InvalidPropertyId();
        return reports[reports.length - 1];
    }

    function getConditionReports(uint256 propertyId) external view returns (ConditionReport[] memory) {
        return conditionReports[propertyId];
    }

    function getAverageAppreciation(uint256 propertyId) external view returns (int256) {
        Valuation[] storage history = valuationHistory[propertyId];
        if (history.length < 2) return 0;
        int256 totalAppreciation = 0;
        uint256 count = 0;
        for (uint256 i = 1; i < history.length; i++) {
            totalAppreciation += history[i].appreciation;
            count++;
        }
        return count > 0 ? totalAppreciation / int256(count) : 0;
    }

    function calculateNOI(uint256 propertyId, uint256 period) external view returns (uint256) {
        Occupancy memory occupancy = currentOccupancy[propertyId];
        uint256 grossIncome = occupancy.monthlyRent * period;
        uint256 maintenanceCosts = totalMaintenanceCosts[propertyId];
        if (grossIncome > maintenanceCosts) {
            return grossIncome - maintenanceCosts;
        }
        return 0;
    }

    function getPropertyMetrics(uint256 propertyId) external view returns (
        uint256 currentValue,
        int256 totalAppreciation,
        uint256 annualRent,
        uint256 maintenanceCosts,
        uint8 conditionScore
    ) {
        Valuation[] storage history = valuationHistory[propertyId];
        if (history.length > 0) {
            currentValue = history[history.length - 1].currentValue;
            if (history.length > 1) {
                uint256 firstValue = history[0].currentValue;
                totalAppreciation = int256((currentValue * 10000 / firstValue)) - 10000;
            }
        }
        Occupancy memory occupancy = currentOccupancy[propertyId];
        annualRent = occupancy.monthlyRent * 12;
        maintenanceCosts = totalMaintenanceCosts[propertyId];
        ConditionReport[] storage reports = conditionReports[propertyId];
        if (reports.length > 0) {
            conditionScore = reports[reports.length - 1].overallScore;
        }
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function batchUpdateValuations(uint256[] memory propertyIds, uint256[] memory newValues, string[] memory sources) external onlyRole(ORACLE_ROLE) whenNotPaused {
        require(propertyIds.length == newValues.length && newValues.length == sources.length, "Array length mismatch");
        for (uint256 i = 0; i < propertyIds.length; i++) {
            if (newValues[i] > 0) {
                this.updateValuation(propertyIds[i], newValues[i], sources[i]);
            }
        }
    }
}
