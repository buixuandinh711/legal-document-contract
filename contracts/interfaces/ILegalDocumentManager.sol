// SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

interface ILegalDocumentManager {
    error SignersSignaturesLengthNotMatch();
    error InvalidSignature();

    event DocumentSubmitted(
        bytes32 indexed documentHash,
        string divisionId,
        uint256 positionIndex,
        address[] signers
    );

    function submitDocument(
        string calldata divisionId,
        uint256 positionIndex,
        bytes calldata documentContent,
        address[] calldata signers,
        bytes calldata signatures
    ) external;
}
