// SPDX-License-Identifier: MIT

pragma solidity 0.8.20;

import "./Utils.sol";
import "./interfaces/IAdminMananger.sol";

contract AdminManger is IAdminMananger {
    address private _admin;

    modifier onlyAdmin() {
        if (msg.sender != _admin) revert NotTheAdmin();
        _;
    }

    constructor(address contractAdmin) {
        _admin = contractAdmin;
    }

    function updateAdmin(address newAdmin) external override onlyAdmin {
        if (newAdmin == address(0)) revert NullAddress();
        _admin = newAdmin;
        emit AdminUpdated(newAdmin);
    }

    function getAdmin() public view override returns (address currentAdmin) {
        currentAdmin = _admin;
    }
}
