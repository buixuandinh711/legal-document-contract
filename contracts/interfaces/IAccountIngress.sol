// SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

interface IAccountIngress {
    function transactionAllowed(
        address sender,
        address target,
        uint256 value,
        uint256 gasPrice,
        uint256 gasLimit,
        bytes calldata payload
    ) external view returns (bool);
}
