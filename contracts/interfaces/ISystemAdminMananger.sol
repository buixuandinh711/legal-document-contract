// SPDX-License-Identifier: MIT

pragma solidity 0.8.20;

interface ISystemAdminMananger {

    error NotTheSystemAdmin();

    event SystemAdminUpdated(address indexed newSystemAdmin);

    function updateSystemAdmin(address newSystemAdmin) external;

    function getSystemAdmin() external returns (address SystemAdmin);
}
