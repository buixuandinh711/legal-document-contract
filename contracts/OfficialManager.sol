// SPDX-License-Identifier: MIT

pragma solidity 0.8.20;

import "./DivisionManager.sol";
import "./interfaces/IOfficialManager.sol";

contract OfficialManager is DivisionManager, IOfficialManager {
    // official address => official info
    mapping(address => Official) private _officials;

    // official address => divisionId => position id => position info
    mapping(address => mapping(string => mapping(uint256 => Position)))
        private _positions;

    modifier onlySystemAdminOrDivisionAdmin(
        string calldata divisionId,
        uint256 creatorPositionId
    ) {
        if (
            msg.sender != getSystemAdmin() &&
            !(_officials[msg.sender].status == OfficialStatus.ACTIVE &&
                _positions[msg.sender][divisionId][creatorPositionId].role ==
                PositionRole.DIVISION_ADMIN)
        ) revert NotSystemAdminOrDivisionAdmin();
        _;
    }

    function creteOfficial(
        address officialAddress,
        OfficialInfo calldata info,
        string calldata divisionId,
        uint256 creatorPositionId,
        uint256 positionId,
        Position calldata position
    )
        external
        override
        onlySystemAdminOrDivisionAdmin(divisionId, creatorPositionId)
    {
        if (_officials[officialAddress].status != OfficialStatus.NOT_CREATED)
            revert OfficialAlreadyCreated();

        _officials[officialAddress] = Official(info, OfficialStatus.ACTIVE);

        _positions[officialAddress][divisionId][positionId] = position;

        emit OfficialCreated(
            officialAddress,
            info,
            divisionId,
            creatorPositionId,
            positionId,
            position
        );
    }

    function updateOfficialInfo(
        address officialAddress,
        OfficialInfo calldata info
    ) external override onlySystemAdmin {
        Official storage official = _officials[officialAddress];

        if (official.status == OfficialStatus.NOT_CREATED)
            revert OfficialNotCreated();

        official.info = info;

        emit OfficialInfoUpdated(officialAddress, info);
    }

    function updateOfficialPosition(
        address officialAddress,
        string calldata divisionId,
        uint256 creatorPositionId,
        uint256 positionId,
        Position calldata position
    )
        external
        override
        onlySystemAdminOrDivisionAdmin(divisionId, creatorPositionId)
    {
        if (_officials[officialAddress].status == OfficialStatus.NOT_CREATED)
            revert OfficialNotCreated();
        _positions[officialAddress][divisionId][positionId] = position;

        emit OfficialPositionUpdated(
            officialAddress,
            divisionId,
            creatorPositionId,
            positionId,
            position
        );
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

    function getOfficialInfo(
        address officialAddress
    ) external view override returns (Official memory official) {
        official = _officials[officialAddress];
    }

    function getOfficialPosition(
        address officialAddress,
        string calldata divisionId,
        uint256 positionId
    ) external view returns (Position memory position) {
        position = _positions[officialAddress][divisionId][positionId];
    }
}
