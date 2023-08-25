// SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

import "./Utils.sol";
import "./interfaces/ISystemAdminMananger.sol";

contract SystemAdminManger is ISystemAdminMananger {
    address private _systemAdmin;

    modifier onlySystemAdmin() {
        if (msg.sender != _systemAdmin) revert NotTheSystemAdmin();
        _;
    }

    constructor() {
        _systemAdmin = msg.sender;
    }

    function updateSystemAdmin(address newSystemAdmin) external override onlySystemAdmin {
        if (newSystemAdmin == address(0)) revert NullAddress();
        _systemAdmin = newSystemAdmin;
        emit SystemAdminUpdated(newSystemAdmin);
    }

    function getSystemAdmin() public view override returns (address currentSystemAdmin) {
        currentSystemAdmin = _systemAdmin;
    }
}
