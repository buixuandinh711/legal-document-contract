// SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

import "./interfaces/ILegalDocumentManager.sol";
import "./PositionManager.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract LegalDocumentManager is ILegalDocumentManager, PositionManager {
    function submitDocument(
        string calldata divisionId,
        uint256 positionIndex,
        bytes calldata documentContent,
        address[] calldata signers,
        bytes calldata signatures
    ) external override {
        requireDivisionManager(divisionId, positionIndex);
        if (signers.length * 65 != signatures.length)
            revert SignersSignaturesLengthNotMatch();

        bytes32 documentHash = keccak256(documentContent);
        bytes32 signedHash = ECDSA.toEthSignedMessageHash(documentHash);

        for (uint256 i = 0; i < signers.length; i++) {
            bytes calldata signature = signatures[i * 65:(i + 1) * 65];
            address recoveredSigner = ECDSA.recover(signedHash, signature);
            if (recoveredSigner != signers[i]) {
                revert InvalidSignature();
            }
        }

        emit DocumentSubmitted(
            documentHash,
            divisionId,
            positionIndex,
            signers
        );
    }
}
