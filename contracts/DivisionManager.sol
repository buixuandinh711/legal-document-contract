// SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

import "./SystemAdminManger.sol";
import "./interfaces/IDivisionManager.sol";

contract DivisionManager is SystemAdminManger, IDivisionManager {
    // divisionId to division's info
    mapping(string => Division) private _divisions;

    //------------------------ Validate functions (for avoiding stack too deep) ----------------------------------/
    function requireActiveDivision(string calldata divisionId) internal view {
        if (_divisions[divisionId].status != DivisionStatus.ACTIVE)
            revert DivisionNotActive();
    }

    function createDivision(
        string calldata divisionId,
        string calldata name,
        string calldata supervisoryDivId
    ) external override onlySystemAdmin {
        if (_divisions[divisionId].status != DivisionStatus.NOT_CREATED)
            revert DivisionAlreadyCreated();

        _divisions[divisionId] = Division(
            DivisionStatus.ACTIVE,
            name,
            supervisoryDivId
        );

        emit DivisionCreated(divisionId, name, supervisoryDivId);
    }

    function updateDivision(
        string calldata divisionId,
        string calldata newName,
        string calldata newSupervisoryDivId
    ) external override onlySystemAdmin {
        requireActiveDivision(divisionId);

        Division storage currentInfo = _divisions[divisionId];

        currentInfo.name = newName;
        currentInfo.supervisoryDivId = newSupervisoryDivId;

        emit DivisionUpdated(divisionId, newName, newSupervisoryDivId);
    }

    function deactivateDivision(
        string calldata divisionId
    ) external override onlySystemAdmin {
        requireActiveDivision(divisionId);

        Division storage currentInfo = _divisions[divisionId];
        currentInfo.status = DivisionStatus.DEACTIVATED;

        emit DivisionDeactivated(divisionId);
    }

    function reactivateDivision(
        string calldata divisionId
    ) external override onlySystemAdmin {
        Division storage currentInfo = _divisions[divisionId];

        if (currentInfo.status != DivisionStatus.DEACTIVATED)
            revert DivisionNotDeactivated();

        currentInfo.status = DivisionStatus.ACTIVE;

        emit DivisionReactivated(divisionId);
    }

    function getDivision(
        string calldata divisionId
    ) external view returns (Division memory division) {
        division = _divisions[divisionId];
    }
}
