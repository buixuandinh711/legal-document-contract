// SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

import "./SystemAdminManger.sol";
import "./interfaces/IOfficerManager.sol";

contract OfficerManager is IOfficerManager, SystemAdminManger {
    // officer address => officer info
    mapping(address => Officer) private _officers;

    //------------------------ Validate functions (for avoiding stack too deep) ----------------------------------/
    function requireCreatedOfficer(address officerAddress) internal view {
        if (_officers[officerAddress].status == OfficerStatus.NOT_CREATED) {
            revert OfficerNotCreated();
        }
    }

    function requireActiveOfficer(address officerAddress) internal view {
        if (_officers[officerAddress].status != OfficerStatus.ACTIVE) {
            revert OfficerNotActive();
        }
    }

    //------------------------ External functions ----------------------------------/
    function createOfficer(
        address officerAddress,
        OfficerInfo calldata info
    ) external override {
        requireSystemAdmin();

        if (_officers[officerAddress].status != OfficerStatus.NOT_CREATED)
            revert OfficerAlreadyCreated();

        _officers[officerAddress] = Officer(info, OfficerStatus.ACTIVE);

        emit OfficerCreated(officerAddress, info);
    }

    function updateOfficerInfo(
        address officerAddress,
        OfficerInfo calldata newInfo
    ) external override {
        requireSystemAdmin();
        requireCreatedOfficer(officerAddress);

        _officers[officerAddress].info = newInfo;

        emit OfficerInfoUpdated(officerAddress, newInfo);
    }

    function deactivateOfficer(address officerAddress) external override {
        requireSystemAdmin();
        requireActiveOfficer(officerAddress);

        _officers[officerAddress].status = OfficerStatus.DEACTIVATED;
        emit OfficerDeactivated(officerAddress);
    }

    function reactivateOfficer(address officerAddress) external override {
        requireSystemAdmin();
        if (_officers[officerAddress].status != OfficerStatus.DEACTIVATED)
            revert OfficerNotDeactivated();

        _officers[officerAddress].status = OfficerStatus.ACTIVE;
        emit OfficerReactivated(officerAddress);
    }

    //------------------------ Public functions ----------------------------------/
    function getOfficerInfo(
        address officerAddress
    ) public view override returns (Officer memory officer) {
        officer = _officers[officerAddress];
    }
}
