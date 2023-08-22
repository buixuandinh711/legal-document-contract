// SPDX-License-Identifier: MIT

pragma solidity 0.8.20;

interface IDivisionManager {
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
    error DivisionNotCreated();
    error DivisionNotActive();
    error DivisionNotDeactivated();

    event DivisionCreated(
        string divisionId,
        string name,
        string supervisoryDivId
    );

    event DivisionUpdated(
        string divisionId,
        string newName,
        string newSupervisoryDivId
    );

    event DivisionDeactivated(string divisionId);
    event DivisionReactivated(string divisionId);

    function createDivision(
        string calldata divisionId,
        string calldata name,
        string calldata supervisoryDivId
    ) external;

    function updateDivision(
        string calldata divisionId,
        string calldata name,
        string calldata supervisoryDivId
    ) external;

    function deactivateDivision(string calldata divisionId) external;

    function reactivateDivision(string calldata divisionId) external;

    function getDivision(
        string calldata divisionId
    ) external view returns (Division memory division);
}
