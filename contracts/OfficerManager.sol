// SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

import "./DivisionManager.sol";
import "./interfaces/IOfficerManager.sol";

contract OfficerManager is DivisionManager, IOfficerManager {
    // officer address => officer info
    mapping(address => Officer) private _officers;

    // officer address => divisionId => position index => position info
    mapping(address => mapping(string => Position[])) private _positions;

    //------------------------ Validate functions (for avoiding stack too deep) ----------------------------------/
    function requireCreatedOfficer(address officerAddress) internal view {
        if (_officers[officerAddress].status == OfficerStatus.NOT_CREATED) {
            revert OfficerNotCreated();
        }
    }

    function requireValidPositionIndex(
        address officerAddress,
        string calldata divisionId,
        uint256 positionIndex
    ) internal view {
        requireCreatedOfficer(officerAddress);
        requireCreatedDivision(divisionId);
        if (positionIndex >= _positions[officerAddress][divisionId].length) {
            revert PositionIndexOutOfRange();
        }
    }

    function requireSystemAdminOrDivisionAdmin(
        string calldata divisionId,
        uint256 creatorPositionIndex
    ) internal view {
        if (msg.sender == getSystemAdmin()) {
            requireCreatedDivision(divisionId);
            return;
        }

        requireValidPositionIndex(msg.sender, divisionId, creatorPositionIndex);
        if (
            !(_officers[msg.sender].status == OfficerStatus.ACTIVE &&
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
            !(_officers[msg.sender].status == OfficerStatus.ACTIVE &&
                _positions[msg.sender][divisionId][positionIndex].role ==
                PositionRole.MANAGER)
        ) {
            revert NotDivisionManager();
        }
    }

    //------------------------ External functions ----------------------------------/
    function createOfficer(
        address officerAddress,
        OfficerInfo calldata info,
        string calldata divisionId,
        uint256 creatorPositionIndex,
        Position calldata position
    ) external override {
        requireSystemAdminOrDivisionAdmin(divisionId, creatorPositionIndex);

        if (_officers[officerAddress].status != OfficerStatus.NOT_CREATED)
            revert OfficerAlreadyCreated();

         if (
            position.role != PositionRole.DIVISION_ADMIN &&
            position.role != PositionRole.MANAGER &&
            position.role != PositionRole.STAFF
        ) revert InvalidCreatedOfficerRole();

        _officers[officerAddress] = Officer(info, OfficerStatus.ACTIVE);

        uint256 positionIndex = _positions[officerAddress][divisionId].length;
        _positions[officerAddress][divisionId].push(position);

        emit OfficerCreated(
            officerAddress,
            info,
            divisionId,
            creatorPositionIndex,
            positionIndex,
            position
        );
    }

    function updateOfficerInfo(
        address officerAddress,
        OfficerInfo calldata info
    ) external override onlySystemAdmin {
        requireCreatedOfficer(officerAddress);

        Officer storage officer = _officers[officerAddress];

        officer.info = info;

        emit OfficerInfoUpdated(officerAddress, info);
    }

    function deactivateOfficer(
        address officerAddress
    ) external override onlySystemAdmin {
        if (_officers[officerAddress].status != OfficerStatus.ACTIVE)
            revert OfficerNotActive();
        _officers[officerAddress].status = OfficerStatus.DEACTIVATED;
        emit OfficerDeactivated(officerAddress);
    }

    function reactivateOfficer(address officerAddress) external override {
        if (_officers[officerAddress].status != OfficerStatus.DEACTIVATED)
            revert OfficerNotDeactivated();
        _officers[officerAddress].status = OfficerStatus.ACTIVE;
        emit OfficerReactivated(officerAddress);
    }

    function updatePositionName(
        address officerAddress,
        string calldata divisionId,
        uint256 creatorPositionIndex,
        uint256 positionIndex,
        string calldata newPositionName
    ) external override {
        requireValidPositionIndex(officerAddress, divisionId, positionIndex);
        requireSystemAdminOrDivisionAdmin(divisionId, creatorPositionIndex);

        _positions[officerAddress][divisionId][positionIndex]
            .name = newPositionName;

        emit PositionNameUpdated(
            officerAddress,
            divisionId,
            creatorPositionIndex,
            positionIndex,
            newPositionName
        );
    }

    function updatePositionRole(
        address officerAddress,
        string calldata divisionId,
        uint256 creatorPositionIndex,
        uint256 positionIndex,
        PositionRole newPositionRole
    ) external override {
        requireValidPositionIndex(officerAddress, divisionId, positionIndex);
        requireSystemAdminOrDivisionAdmin(divisionId, creatorPositionIndex);

        if (
            newPositionRole != PositionRole.DIVISION_ADMIN &&
            newPositionRole != PositionRole.MANAGER &&
            newPositionRole != PositionRole.STAFF
        ) revert InvalidUpdatedRole();

        _positions[officerAddress][divisionId][positionIndex]
            .role = newPositionRole;

        emit PositionRoleUpdated(
            officerAddress,
            divisionId,
            creatorPositionIndex,
            positionIndex,
            newPositionRole
        );
    }

    function revokePositionRole(
        address officerAddress,
        string calldata divisionId,
        uint256 creatorPositionIndex,
        uint256 positionIndex
    ) external override {
        requireValidPositionIndex(officerAddress, divisionId, positionIndex);
        requireSystemAdminOrDivisionAdmin(divisionId, creatorPositionIndex);

        _positions[officerAddress][divisionId][positionIndex]
            .role = PositionRole.REVOKED;

        emit PositionRoleRevoked(
            officerAddress,
            divisionId,
            creatorPositionIndex,
            positionIndex
        );
    }

    //------------------------ Public functions ----------------------------------/
    function getOfficerInfo(
        address officerAddress
    ) public view override returns (Officer memory officer) {
        officer = _officers[officerAddress];
    }

    function getOfficerPosition(
        address officerAddress,
        string calldata divisionId,
        uint256 positionIndex
    ) public view override returns (Position memory position) {
        position = _positions[officerAddress][divisionId][positionIndex];
    }

    function getOfficerPositions(
        address officerAddress,
        string calldata divisionId
    ) public view returns (Position[] memory positions) {
        positions = _positions[officerAddress][divisionId];
    }
}
