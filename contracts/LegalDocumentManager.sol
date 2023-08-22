// SPDX-License-Identifier: MIT

pragma solidity 0.8.20;

import "./interfaces/IDivisionManager.sol";
import "./AdminManger.sol";

contract LegalDocumentManager is AdminManger, IDivisionManager {
    // divisionId to division's info
    mapping(string => Division) private _divisions;

    constructor(address contractAdmin) AdminManger(contractAdmin) {}

    function createDivision(
        string calldata divisionId,
        string calldata name,
        string calldata supervisoryDivId
    ) external override onlyAdmin {
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
    ) external override onlyAdmin {
        Division storage currentInfo = _divisions[divisionId];

        if (currentInfo.status == DivisionStatus.NOT_CREATED)
            revert DivisionNotCreated();

        currentInfo.name = newName;
        currentInfo.supervisoryDivId = newSupervisoryDivId;

        emit DivisionUpdated(divisionId, newName, newSupervisoryDivId);
    }

    function deactivateDivision(
        string calldata divisionId
    ) external override onlyAdmin {
        Division storage currentInfo = _divisions[divisionId];

        if (currentInfo.status != DivisionStatus.ACTIVE)
            revert DivisionNotActive();

        currentInfo.status = DivisionStatus.DEACTIVATED;

        emit DivisionDeactivated(divisionId);
    }

    function reactivateDivision(
        string calldata divisionId
    ) external override onlyAdmin {
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
