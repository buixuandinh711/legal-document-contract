// SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

import "./interfaces/ILegalDocumentManager.sol";
import "./PositionManager.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract LegalDocumentManager is ILegalDocumentManager, PositionManager {
    mapping(bytes32 => PublishedDocument) _publishedDocuments; //documentContentHash => publication info

    function publishDocument(
        string calldata divisionId,
        uint256 publisherPositionIndex,
        DocumentInfo memory documentInfo,
        bytes calldata documentContent,
        OfficerPosition[] calldata signers,
        bytes calldata signatures
    ) external override {
        requireDivisionManager(divisionId, publisherPositionIndex);
        if (signers.length * 65 != signatures.length)
            revert SignersSignaturesLengthNotMatch();

        bytes32 documentContentHash = keccak256(documentContent);

        if (isDocumentPublished(documentContentHash))
            revert DocumentAlreadlyPublished();

        for (uint256 i = 0; i < signers.length; i++) {
            requireValidSigner(signers[i]);

            bytes memory signedInfo = abi.encodePacked(
                signers[i].divisionId,
                signers[i].positionIndex,
                documentInfo.number,
                documentInfo.name,
                documentInfo.divisionId,
                documentInfo.publishedTimestamp,
                documentContentHash
            );
            bytes32 signedHash = keccak256(signedInfo);
            bytes32 ethSignedHash = ECDSA.toEthSignedMessageHash(signedHash);
            bytes calldata signature = signatures[i * 65:(i + 1) * 65];
            address recoveredSigner = ECDSA.recover(ethSignedHash, signature);

            if (recoveredSigner != signers[i].officerAddress) {
                revert InvalidSignature();
            }
        }

        _publishedDocuments[documentContentHash].info = documentInfo;
        OfficerPosition memory publisher = OfficerPosition(
            msg.sender,
            divisionId,
            publisherPositionIndex
        );
        _publishedDocuments[documentContentHash].publisher = publisher;
        for (uint256 i = 0; i < signers.length; i++) {
            _publishedDocuments[documentContentHash].signers.push(signers[i]);
        }

        emit DocumentPublished(
            documentContentHash,
            documentInfo,
            publisher,
            signers
        );
    }

    function getDocument(
        bytes32 documentContentHash
    ) external view returns (PublishedDocument memory document) {
        document = _publishedDocuments[documentContentHash];
    }

    function isDocumentPublished(
        bytes32 documentContentHash
    ) private view returns (bool isPublished) {
        isPublished =
            _publishedDocuments[documentContentHash].info.publishedTimestamp !=
            0 &&
            _publishedDocuments[documentContentHash].publisher.officerAddress !=
            address(0);
    }
}
