// SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

import "./ISystemAdminMananger.sol";
import "./IDivisionManager.sol";
import "./IOfficerManager.sol";

interface IPositionManager is
    ISystemAdminMananger,
    IDivisionManager,
    IOfficerManager
{
    enum PositionRole {
        REVOKED,
        DIVISION_ADMIN,
        MANAGER,
        STAFF
    }

    struct Position {
        string name;
        PositionRole role;
    }

    //------------------------ Errors ----------------------------------/

    error PositionIndexOutOfRange();
    error PositionIndexNotAssigned();
    error NotTheSystemOrDivisionAdmin();
    error InvalidCreatedPositionRole();
    error InvalidUpdateddPositionRole();
    error NotTheDivisionManager();

    //------------------------ Events ----------------------------------/

    event PositionCreated(
        address officerAddress,
        string divisionId,
        Position positionInfo,
        uint256 positionIndex,
        uint256 creatorPositionIndex
    );

    event PositionRevoked(
        address officerAddress,
        string divisionId,
        uint256 positionIndex,
        uint256 updaterPositionIndex
    );

    event PositionNameUpdated(
        address officerAddress,
        string divisionId,
        uint256 positionIndex,
        string newPositionName,
        uint256 updaterPositionIndex
    );

    event PositionRoleUpdated(
        address officerAddress,
        string divisionId,
        uint256 positionIndex,
        PositionRole newPositionRole,
        uint256 updaterPositionIndex
    );

    //------------------------ External functions ----------------------------------/
    function createPosition(
        address officerAddress,
        string calldata divisionId,
        Position calldata positionInfo,
        uint256 creatorPositionIndex
    ) external;

    function revokePosition(
        address officerAddress,
        string calldata divisionId,
        uint256 positionIndex,
        uint256 updaterPositionIndex
    ) external;

    function updatePositionName(
        address officerAddress,
        string calldata divisionId,
        uint256 positionIndex,
        string calldata newPositionName,
        uint256 updaterPositionIndex
    ) external;

    function updatePositionRole(
        address officerAddress,
        string calldata divisionId,
        uint256 positionIndex,
        PositionRole newPositionRole,
        uint256 updaterPositionIndex
    ) external;

    function getPosition(
        address officerAddress,
        string calldata divisionId,
        uint256 positionIndex
    ) external view returns (Position memory position);

    function getPositions(
        address officerAddress,
        string calldata divisionId
    ) external view returns (Position[] memory positions);

    function getMaxPositionIndex() external pure returns (uint256);

    function getAdminPositionIndex() external pure returns (uint256);
}
