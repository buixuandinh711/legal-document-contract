// SPDX-License-Identifier: MIT

pragma solidity 0.8.20;

interface IAdminMananger {

    error NotTheAdmin();

    event AdminUpdated(address indexed newAdmin);

    function updateAdmin(address newAdmin) external;

    function getAdmin() external returns (address admin);
}
