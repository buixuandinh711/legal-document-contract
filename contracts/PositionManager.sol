// SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

import "./interfaces/IPositionManager.sol";
import "./SystemAdminManger.sol";
import "./DivisionManager.sol";
import "./OfficerManager.sol";

contract PositionManager is
    IPositionManager,
    SystemAdminManger,
    DivisionManager,
    OfficerManager
{
    uint256 private constant MAX_POSITION_INDEX = 1000;
    uint256 private constant ADMIN_POSITION_INDEX = 1001;

    // officer address => divisionId => position index => position info
    mapping(address => mapping(string => Position[])) private _positions;

    //------------------------ Validate functions (for avoiding stack too deep) ----------------------------------/

    function requireValidPositionIndex(
        address officerAddress,
        string memory divisionId,
        uint256 positionIndex
    ) internal view {
        if (positionIndex > MAX_POSITION_INDEX)
            revert PositionIndexOutOfRange();
        if (positionIndex >= _positions[officerAddress][divisionId].length)
            revert PositionIndexNotAssigned();
    }

    function requireSystemAdminOrDivisionAdmin(
        string calldata divisionId,
        uint256 positionIndex
    ) internal view {
        address sender = msg.sender;

        if (positionIndex == ADMIN_POSITION_INDEX) {
            requireSystemAdmin();
            return;
        }

        requireActiveDivision(divisionId);
        requireActiveOfficer(sender);
        requireValidPositionIndex(sender, divisionId, positionIndex);

        if (
            _positions[sender][divisionId][positionIndex].role !=
            PositionRole.DIVISION_ADMIN
        ) revert NotTheSystemOrDivisionAdmin();
    }

    function requireDivisionManager(
        string calldata divisionId,
        uint256 positionIndex
    ) internal view {
        address sender = msg.sender;

        requireActiveDivision(divisionId);
        requireActiveOfficer(sender);
        requireValidPositionIndex(sender, divisionId, positionIndex);

        if (
            _positions[sender][divisionId][positionIndex].role !=
            PositionRole.MANAGER
        ) revert NotTheDivisionManager();
    }

    function createPosition(
        address officerAddress,
        string calldata divisionId,
        Position calldata positionInfo,
        uint256 creatorPositionIndex
    ) external override {
        requireSystemAdminOrDivisionAdmin(divisionId, creatorPositionIndex);
        requireActiveOfficer(officerAddress);
        requireActiveDivision(divisionId);

        if (
            positionInfo.role != PositionRole.DIVISION_ADMIN &&
            positionInfo.role != PositionRole.MANAGER &&
            positionInfo.role != PositionRole.STAFF
        ) revert InvalidCreatedPositionRole();

        uint256 positionIndex = _positions[officerAddress][divisionId].length;
        _positions[officerAddress][divisionId].push(positionInfo);

        emit PositionCreated(
            officerAddress,
            divisionId,
            positionInfo,
            positionIndex,
            creatorPositionIndex
        );
    }

    function revokePosition(
        address officerAddress,
        string calldata divisionId,
        uint256 positionIndex,
        uint256 updaterPositionIndex
    ) external override {
        requireSystemAdminOrDivisionAdmin(divisionId, updaterPositionIndex);
        requireCreatedOfficer(officerAddress);
        requireCreatedDivision(divisionId);
        requireValidPositionIndex(officerAddress, divisionId, positionIndex);

        _positions[officerAddress][divisionId][positionIndex]
            .role = PositionRole.REVOKED;

        emit PositionRevoked(
            officerAddress,
            divisionId,
            positionIndex,
            updaterPositionIndex
        );
    }

    function updatePositionName(
        address officerAddress,
        string calldata divisionId,
        uint256 positionIndex,
        string calldata newPositionName,
        uint256 updaterPositionIndex
    ) external override {
        requireSystemAdminOrDivisionAdmin(divisionId, updaterPositionIndex);
        requireCreatedOfficer(officerAddress);
        requireCreatedDivision(divisionId);
        requireValidPositionIndex(officerAddress, divisionId, positionIndex);

        _positions[officerAddress][divisionId][positionIndex]
            .name = newPositionName;

        emit PositionNameUpdated(
            officerAddress,
            divisionId,
            positionIndex,
            newPositionName,
            updaterPositionIndex
        );
    }

    function updatePositionRole(
        address officerAddress,
        string calldata divisionId,
        uint256 positionIndex,
        PositionRole newPositionRole,
        uint256 updaterPositionIndex
    ) external override {
        requireSystemAdminOrDivisionAdmin(divisionId, updaterPositionIndex);
        requireCreatedOfficer(officerAddress);
        requireCreatedDivision(divisionId);
        requireValidPositionIndex(officerAddress, divisionId, positionIndex);

        if (
            newPositionRole != PositionRole.DIVISION_ADMIN &&
            newPositionRole != PositionRole.MANAGER &&
            newPositionRole != PositionRole.STAFF
        ) revert InvalidUpdateddPositionRole();

        _positions[officerAddress][divisionId][positionIndex]
            .role = newPositionRole;

        emit PositionRoleUpdated(
            officerAddress,
            divisionId,
            positionIndex,
            newPositionRole,
            updaterPositionIndex
        );
    }

    function getPosition(
        address officerAddress,
        string calldata divisionId,
        uint256 positionIndex
    ) external view override returns (Position memory position) {
        position = _positions[officerAddress][divisionId][positionIndex];
    }

    function getPositions(
        address officerAddress,
        string calldata divisionId
    ) external view override returns (Position[] memory positions) {
        positions = _positions[officerAddress][divisionId];
    }

    function getMaxPositionIndex()
        external
        pure
        override
        returns (uint256 maxPositionIndex)
    {
        maxPositionIndex = MAX_POSITION_INDEX;
    }

    function getAdminPositionIndex()
        external
        pure
        override
        returns (uint256 adminPositionIndex)
    {
        adminPositionIndex = ADMIN_POSITION_INDEX;
    }
}
