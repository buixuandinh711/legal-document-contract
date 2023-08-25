// SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

import "./interfaces/IAccountIngress.sol";

contract AccountIngress is IAccountIngress {
    function transactionAllowed(
        address sender,
        address target,
        uint256 value,
        uint256 gasPrice,
        uint256 gasLimit,
        bytes calldata payload
    ) external pure override returns (bool) {
        (sender, value, gasPrice, gasLimit, payload);
        
    }
}
