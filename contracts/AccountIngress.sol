// SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

import "./interfaces/IAccountIngress.sol";
import "./interfaces/ILegalDocumentManager.sol";

contract AccountIngress is IAccountIngress {
    ILegalDocumentManager private _documentManager;

    error NotSystemAdmin();

    event DocumentManagerUpdated(address newDocumentManager);

    constructor(ILegalDocumentManager documentManagerAddress) {
        _documentManager = documentManagerAddress;
    }

    function updateDocumentManager(
        ILegalDocumentManager newDocumentManager
    ) external {
        if (msg.sender != _documentManager.getSystemAdmin())
            revert NotSystemAdmin();

        _documentManager = newDocumentManager;
        emit DocumentManagerUpdated(address(newDocumentManager));
    }

    function transactionAllowed(
        address sender,
        address target,
        uint256 value,
        uint256 gasPrice,
        uint256 gasLimit,
        bytes calldata payload
    ) external override returns (bool) {
        (sender, value, gasPrice, gasLimit, payload);

        if (sender == _documentManager.getSystemAdmin()) {
            return true;
        }

        if (
            _documentManager.getOfficialInfo(sender).status ==
            OfficialStatus.ACTIVE
        ) {
            if (target == address(_documentManager)) return true;
        }

        return false;
    }

    function getDocumentManager()
        public
        view
        returns (address documentManager)
    {
        documentManager = address(_documentManager);
    }
}
