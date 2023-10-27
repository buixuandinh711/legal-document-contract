// SPDX-License-Identifier: MIT

pragma solidity 0.8.19;
import "./IPositionManager.sol";

interface ILegalDocumentManager is IPositionManager {
    struct DocumentInfo {
        string number;
        string name;
        string divisionId;
        uint256 publishedTimestamp;
    }

    struct PublishedDocument {
        DocumentInfo info;
        OfficerPosition publisher;
        OfficerPosition[] signers;
    }

    error SignersSignaturesLengthNotMatch();
    error InvalidSignature();
    error DocumentAlreadlyPublished();

    event DocumentPublished(
        bytes32 indexed documentContentHash,
        DocumentInfo documentInfo,
        OfficerPosition publisher,
        OfficerPosition[] signers
    );

    function publishDocument(
        string calldata divisionId,
        uint256 publisherPositionIndex,
        DocumentInfo calldata documentInfo,
        bytes calldata documentContent,
        OfficerPosition[] calldata signers,
        bytes calldata signatures
    ) external;
}
