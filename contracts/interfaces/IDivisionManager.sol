// SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

import "./ISystemAdminMananger.sol";

interface IDivisionManager is ISystemAdminMananger {
    enum DivisionStatus {
        NOT_CREATED,
        ACTIVE,
        DEACTIVATED
    }

    struct Division {
        DivisionStatus status;
        string name;
        string supervisoryDivId;
    }

    error DivisionAlreadyCreated();
    error DivisionNotActive();
    error DivisionNotDeactivated();
    error DivisionNotCreated();
    error InvalidSupervisoryDivisionId();

    event DivisionCreated(
        string divisionId,
        string name,
        string supervisoryDivId
    );

    event DivisionNameUpdated(string divisionId, string newName);

    event DivisionDeactivated(string divisionId);
    event DivisionReactivated(string divisionId);

    function createDivision(
        string calldata divisionId,
        string calldata name,
        string calldata supervisoryDivId
    ) external;

    function updateDivisionName(
        string calldata divisionId,
        string calldata name
    ) external;

    function deactivateDivision(string calldata divisionId) external;

    function reactivateDivision(string calldata divisionId) external;

    function getDivision(
        string calldata divisionId
    ) external view returns (Division memory division);
}
