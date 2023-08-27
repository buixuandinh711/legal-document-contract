// SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

import "./IDivisionManager.sol";

enum OfficialStatus {
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

interface IOfficialManager is IDivisionManager {
    struct OfficialInfo {
        string name;
        string sex;
        string dateOfBirth;
    }

    struct Official {
        OfficialInfo info;
        OfficialStatus status;
    }

    struct Position {
        string name;
        PositionRole role;
    }

    //------------------------ Errors ----------------------------------/
    error OfficialAlreadyCreated();
    error OfficialNotCreated();
    error NotSystemAdminOrDivisionAdmin();
    error OfficialNotActive();
    error OfficialNotDeactivated();
    error PositionNotGranted();
    error InvalidUpdatedRole();
    error PositionIndexOutOfRange();
    error InvalidCreatedOfficialRole();
    error NotDivisionManager();

    //------------------------ Events ----------------------------------/
    event OfficialCreated(
        address indexed officialAddress,
        OfficialInfo info,
        string divisionId,
        uint256 creatorPositionIndex,
        uint256 positionIndex,
        Position position
    );

    event OfficialInfoUpdated(
        address indexed officialAddress,
        OfficialInfo info
    );

    event PositionNameUpdated(
        address indexed officialAddress,
        string divisionId,
        uint256 creatorPositionIndex,
        uint256 positionIndex,
        string newPositionName
    );

    event PositionRoleUpdated(
        address indexed officialAddress,
        string divisionId,
        uint256 creatorPositionIndex,
        uint256 positionIndex,
        PositionRole newPositionRole
    );

    event PositionRoleRevoked(
        address indexed officialAddress,
        string divisionId,
        uint256 creatorPositionIndex,
        uint256 positionIndex
    );

    function createOfficial(
        address officialAddress,
        OfficialInfo calldata info,
        string calldata divisionId,
        uint256 creatorPositionIndex,
        Position calldata position
    ) external;

    function updateOfficialInfo(
        address officialAddress,
        OfficialInfo calldata info
    ) external;

    function deactivateOfficial(address officialAddress) external;

    function reactivateOfficial(address officialAddress) external;

    function updatePositionName(
        address officialAddress,
        string calldata divisionId,
        uint256 creatorPositionIndex,
        uint256 positionIndex,
        string calldata newPositionName
    ) external;

    function updatePositionRole(
        address officialAddress,
        string calldata divisionId,
        uint256 creatorPositionIndex,
        uint256 positionIndex,
        PositionRole newPositionRole
    ) external;

    function revokePositionRole(
        address officialAddress,
        string calldata divisionId,
        uint256 creatorPositionIndex,
        uint256 positionIndex
    ) external;

    function getOfficialInfo(
        address officialAddress
    ) external view returns (Official memory official);

    function getOfficialPosition(
        address officialAddress,
        string calldata divisionId,
        uint256 positionIndex
    ) external view returns (Position memory position);

    function getOfficialPositions(
        address officialAddress,
        string calldata divisionId
    ) external view returns (Position[] memory positions);
}
