// SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

import "./SystemAdminManger.sol";
import "./interfaces/IDivisionManager.sol";

contract DivisionManager is IDivisionManager, SystemAdminManger {
    // divisionId to division's info
    mapping(string => Division) private _divisions;

    //------------------------ Validate functions (for avoiding stack too deep) ----------------------------------/

    function requireCreatedDivision(string calldata divisionId) internal view {
        if (_divisions[divisionId].status != DivisionStatus.ACTIVE)
            revert DivisionNotCreated();
    }

    function requireActiveDivision(string calldata divisionId) internal view {
        if (_divisions[divisionId].status != DivisionStatus.ACTIVE)
            revert DivisionNotActive();
    }

    function createDivision(
        string calldata divisionId,
        string calldata name,
        string calldata supervisoryDivId
    ) external override {
        requireSystemAdmin();

        if (_divisions[divisionId].status != DivisionStatus.NOT_CREATED)
            revert DivisionAlreadyCreated();

        if (_divisions[supervisoryDivId].status != DivisionStatus.ACTIVE)
            revert SupervisoryDivisionNotActive();

        _divisions[divisionId] = Division(
            DivisionStatus.ACTIVE,
            name,
            supervisoryDivId
        );

        emit DivisionCreated(divisionId, name, supervisoryDivId);
    }

    function updateDivisionName(
        string calldata divisionId,
        string calldata newName
    ) external override {
        requireSystemAdmin();
        requireCreatedDivision(divisionId);

        Division storage currentInfo = _divisions[divisionId];

        currentInfo.name = newName;

        emit DivisionNameUpdated(divisionId, newName);
    }

    function deactivateDivision(string calldata divisionId) external override {
        requireSystemAdmin();
        requireActiveDivision(divisionId);

        _divisions[divisionId].status = DivisionStatus.DEACTIVATED;

        emit DivisionDeactivated(divisionId);
    }

    function reactivateDivision(string calldata divisionId) external override {
        requireSystemAdmin();

        if (_divisions[divisionId].status != DivisionStatus.DEACTIVATED)
            revert DivisionNotDeactivated();

        _divisions[divisionId].status = DivisionStatus.ACTIVE;

        emit DivisionReactivated(divisionId);
    }

    function getDivision(
        string calldata divisionId
    ) external view returns (Division memory division) {
        division = _divisions[divisionId];
    }
}
