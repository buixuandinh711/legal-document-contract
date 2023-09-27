// SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

import "./interfaces/ISystemAdminMananger.sol";

contract SystemAdminManger is ISystemAdminMananger {
    address private _systemAdmin;

    function requireSystemAdmin() internal view {
        if (msg.sender != _systemAdmin) revert NotTheSystemAdmin();
    }

    constructor() {
        _systemAdmin = msg.sender;
    }

    function updateSystemAdmin(address newSystemAdmin) external override {
        requireSystemAdmin();

        _systemAdmin = newSystemAdmin;
        emit SystemAdminUpdated(newSystemAdmin);
    }

    function getSystemAdmin()
        public
        view
        override
        returns (address currentSystemAdmin)
    {
        currentSystemAdmin = _systemAdmin;
    }
}
