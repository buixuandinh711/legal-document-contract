// SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

import "./DivisionManager.sol";
import "./interfaces/IOfficialManager.sol";

contract OfficialManager is DivisionManager, IOfficialManager {
    // official address => official info
    mapping(address => Official) private _officials;

    // official address => divisionId => position id => position info
    mapping(address => mapping(string => Position[])) private _positions;

    //------------------------ Validate functions (for avoiding stack too deep) ----------------------------------/
    function requireCreatedOfficial(address officialAddress) internal view {
        if (_officials[officialAddress].status == OfficialStatus.NOT_CREATED) {
            revert OfficialNotCreated();
        }
    }

    function requireValidPositionIndex(
        address officialAddress,
        string calldata divisionId,
        uint256 positionIndex
    ) internal view {
        requireCreatedOfficial(officialAddress);
        requireCreatedDivision(divisionId);
        if (positionIndex >= _positions[officialAddress][divisionId].length) {
            revert PositionIndexOutOfRange();
        }
    }

    function requireSystemAdminOrDivisionAdmin(
        string calldata divisionId,
        uint256 creatorPositionIndex
    ) internal view {
        if (msg.sender == getSystemAdmin()) return;

        requireValidPositionIndex(msg.sender, divisionId, creatorPositionIndex);
        if (
            !(_officials[msg.sender].status == OfficialStatus.ACTIVE &&
                _positions[msg.sender][divisionId][creatorPositionIndex].role ==
                PositionRole.DIVISION_ADMIN)
        ) {
            revert NotSystemAdminOrDivisionAdmin();
        }
    }

    function requireDivisionManager(
        string calldata divisionId,
        uint256 positionIndex
    ) internal view {
        requireValidPositionIndex(msg.sender, divisionId, positionIndex);
        if (
            !(_officials[msg.sender].status == OfficialStatus.ACTIVE &&
                _positions[msg.sender][divisionId][positionIndex].role ==
                PositionRole.MANAGER)
        ) {
            revert NotDivisionManager();
        }
    }

    //------------------------ External functions ----------------------------------/
    function createOfficial(
        address officialAddress,
        OfficialInfo calldata info,
        string calldata divisionId,
        uint256 creatorPositionIndex,
        Position calldata position
    ) external override {
        requireSystemAdminOrDivisionAdmin(divisionId, creatorPositionIndex);

        if (_officials[officialAddress].status != OfficialStatus.NOT_CREATED)
            revert OfficialAlreadyCreated();

        _officials[officialAddress] = Official(info, OfficialStatus.ACTIVE);

        if (
            position.role != PositionRole.DIVISION_ADMIN &&
            position.role != PositionRole.MANAGER &&
            position.role != PositionRole.STAFF
        ) revert InvalidCreatedOfficialRole();
        uint256 positionIndex = _positions[officialAddress][divisionId].length;
        _positions[officialAddress][divisionId].push(position);

        emit OfficialCreated(
            officialAddress,
            info,
            divisionId,
            creatorPositionIndex,
            positionIndex,
            position
        );
    }

    function updateOfficialInfo(
        address officialAddress,
        OfficialInfo calldata info
    ) external override onlySystemAdmin {
        requireCreatedOfficial(officialAddress);

        Official storage official = _officials[officialAddress];

        official.info = info;

        emit OfficialInfoUpdated(officialAddress, info);
    }

    function deactivateOfficial(
        address officialAddress
    ) external override onlySystemAdmin {
        if (_officials[officialAddress].status != OfficialStatus.ACTIVE)
            revert OfficialNotActive();
        _officials[officialAddress].status = OfficialStatus.DEACTIVATED;
    }

    function reactivateOfficial(address officialAddress) external override {
        if (_officials[officialAddress].status != OfficialStatus.DEACTIVATED)
            revert OfficialNotDeactivated();
        _officials[officialAddress].status = OfficialStatus.ACTIVE;
    }

    function updatePositionName(
        address officialAddress,
        string calldata divisionId,
        uint256 creatorPositionIndex,
        uint256 positionIndex,
        string calldata newPositionName
    ) external override {
        requireValidPositionIndex(officialAddress, divisionId, positionIndex);
        requireSystemAdminOrDivisionAdmin(divisionId, creatorPositionIndex);

        _positions[officialAddress][divisionId][positionIndex]
            .name = newPositionName;

        emit PositionNameUpdated(
            officialAddress,
            divisionId,
            creatorPositionIndex,
            positionIndex,
            newPositionName
        );
    }

    function updatePositionRole(
        address officialAddress,
        string calldata divisionId,
        uint256 creatorPositionIndex,
        uint256 positionIndex,
        PositionRole newPositionRole
    ) external override {
        requireValidPositionIndex(officialAddress, divisionId, positionIndex);
        requireSystemAdminOrDivisionAdmin(divisionId, creatorPositionIndex);

        if (
            newPositionRole != PositionRole.DIVISION_ADMIN ||
            newPositionRole != PositionRole.MANAGER ||
            newPositionRole != PositionRole.STAFF
        ) revert InvalidUpdatedRole();

        _positions[officialAddress][divisionId][positionIndex]
            .role = newPositionRole;

        emit PositionRoleUpdated(
            officialAddress,
            divisionId,
            creatorPositionIndex,
            positionIndex,
            newPositionRole
        );
    }

    function revokePositionRole(
        address officialAddress,
        string calldata divisionId,
        uint256 creatorPositionIndex,
        uint256 positionIndex
    ) external override {
        requireValidPositionIndex(officialAddress, divisionId, positionIndex);
        requireSystemAdminOrDivisionAdmin(divisionId, creatorPositionIndex);

        _positions[officialAddress][divisionId][positionIndex]
            .role = PositionRole.REVOKED;

        emit PositionRoleRevoked(
            officialAddress,
            divisionId,
            creatorPositionIndex,
            positionIndex
        );
    }

    //------------------------ Public functions ----------------------------------/
    function getOfficialInfo(
        address officialAddress
    ) public view override returns (Official memory official) {
        official = _officials[officialAddress];
    }

    function getOfficialPosition(
        address officialAddress,
        string calldata divisionId,
        uint256 positionIndex
    ) public view override returns (Position memory position) {
        position = _positions[officialAddress][divisionId][positionIndex];
    }

    function getOfficialPositions(
        address officialAddress,
        string calldata divisionId
    ) public view returns (Position[] memory positions) {
        positions = _positions[officialAddress][divisionId];
    }
}
