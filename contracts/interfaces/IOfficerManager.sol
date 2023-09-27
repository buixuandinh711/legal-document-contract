// SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

import "./ISystemAdminMananger.sol";

interface IOfficerManager is ISystemAdminMananger {
    enum OfficerStatus {
        NOT_CREATED,
        ACTIVE,
        DEACTIVATED
    }

    struct OfficerInfo {
        string name;
        string sex;
        string dateOfBirth;
    }

    struct Officer {
        OfficerInfo info;
        OfficerStatus status;
    }

    //------------------------ Errors ----------------------------------/
    error OfficerAlreadyCreated();
    error OfficerNotCreated();
    error OfficerNotActive();
    error OfficerNotDeactivated();

    //------------------------ Events ----------------------------------/
    event OfficerCreated(address indexed officerAddress, OfficerInfo info);

    event OfficerInfoUpdated(address indexed officerAddress, OfficerInfo info);

    event OfficerDeactivated(address indexed officerAddress);

    event OfficerReactivated(address indexed officerAddress);

    function createOfficer(
        address officerAddress,
        OfficerInfo calldata info
    ) external;

    function updateOfficerInfo(
        address officerAddress,
        OfficerInfo calldata info
    ) external;

    function deactivateOfficer(address officerAddress) external;

    function reactivateOfficer(address officerAddress) external;

    function getOfficerInfo(
        address officerAddress
    ) external view returns (Officer memory officer);
}
