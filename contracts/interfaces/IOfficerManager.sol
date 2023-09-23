// SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

import "./IDivisionManager.sol";

enum OfficerStatus {
    NOT_CREATED,
    ACTIVE,
    DEACTIVATED
}

enum PositionRole {
    REVOKED,
    DIVISION_ADMIN,
    MANAGER,
    STAFF
}

interface IOfficerManager is IDivisionManager {
    struct OfficerInfo {
        string name;
        string sex;
        string dateOfBirth;
    }

    struct Officer {
        OfficerInfo info;
        OfficerStatus status;
    }

    struct Position {
        string name;
        PositionRole role;
    }

    //------------------------ Errors ----------------------------------/
    error OfficerAlreadyCreated();
    error OfficerNotCreated();
    error NotSystemAdminOrDivisionAdmin();
    error OfficerNotActive();
    error OfficerNotDeactivated();
    error PositionNotGranted();
    error InvalidUpdatedRole();
    error PositionIndexOutOfRange();
    error InvalidCreatedOfficerRole();
    error NotDivisionManager();

    //------------------------ Events ----------------------------------/
    event OfficerCreated(
        address indexed officerAddress,
        OfficerInfo info,
        string divisionId,
        uint256 creatorPositionIndex,
        uint256 positionIndex,
        Position position
    );

    event OfficerInfoUpdated(
        address indexed officerAddress,
        OfficerInfo info
    );

    event OfficerDeactivated(address indexed officerAddress);
    
    event OfficerReactivated(address indexed officerAddress);

    event PositionNameUpdated(
        address indexed officerAddress,
        string divisionId,
        uint256 creatorPositionIndex,
        uint256 positionIndex,
        string newPositionName
    );

    event PositionRoleUpdated(
        address indexed officerAddress,
        string divisionId,
        uint256 creatorPositionIndex,
        uint256 positionIndex,
        PositionRole newPositionRole
    );

    event PositionRoleRevoked(
        address indexed officerAddress,
        string divisionId,
        uint256 creatorPositionIndex,
        uint256 positionIndex
    );

    function createOfficer(
        address officerAddress,
        OfficerInfo calldata info,
        string calldata divisionId,
        uint256 creatorPositionIndex,
        Position calldata position
    ) external;

    function updateOfficerInfo(
        address officerAddress,
        OfficerInfo calldata info
    ) external;

    function deactivateOfficer(address officerAddress) external;

    function reactivateOfficer(address officerAddress) external;

    function updatePositionName(
        address officerAddress,
        string calldata divisionId,
        uint256 creatorPositionIndex,
        uint256 positionIndex,
        string calldata newPositionName
    ) external;

    function updatePositionRole(
        address officerAddress,
        string calldata divisionId,
        uint256 creatorPositionIndex,
        uint256 positionIndex,
        PositionRole newPositionRole
    ) external;

    function revokePositionRole(
        address officerAddress,
        string calldata divisionId,
        uint256 creatorPositionIndex,
        uint256 positionIndex
    ) external;

    function getOfficerInfo(
        address officerAddress
    ) external view returns (Officer memory officer);

    function getOfficerPosition(
        address officerAddress,
        string calldata divisionId,
        uint256 positionIndex
    ) external view returns (Position memory position);

    function getOfficerPositions(
        address officerAddress,
        string calldata divisionId
    ) external view returns (Position[] memory positions);
}
