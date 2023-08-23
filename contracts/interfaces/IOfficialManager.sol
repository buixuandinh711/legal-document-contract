// SPDX-License-Identifier: MIT

pragma solidity 0.8.20;

interface IOfficialManager {
    enum OfficialStatus {
        NOT_CREATED,
        ACTIVE,
        DEACTIVATED
    }

    enum PositionRole {
        NOT_GRANTED,
        DIVISION_ADMIN,
        MANAGER,
        STAFF
    }

    struct OfficialInfo {
        string name;
        string sex;
        string dateOfBirth;
    }

    struct Official {
        OfficialInfo info;
        OfficialStatus status;
    }

    struct Position {
        string name;
        PositionRole role;
    }

    //------------------------ Errors ----------------------------------/
    error OfficialAlreadyCreated();
    error OfficialNotCreated();
    error NotSystemAdminOrDivisionAdmin();
    error OfficialNotActive();
    error OfficialNotDeactivated();

    //------------------------ Events ----------------------------------/
    event OfficialCreated(
        address indexed officialAddress,
        OfficialInfo info,
        string divisionId,
        uint256 creatorPositionId,
        uint256 positionId,
        Position position
    );

    event OfficialInfoUpdated(
        address indexed officialAddress,
        OfficialInfo info
    );

    event OfficialPositionUpdated(
        address indexed officialAddress,
        string divisionId,
        uint256 creatorPositionId,
        uint256 positionId,
        Position position
    );

    function creteOfficial(
        address officialAddress,
        OfficialInfo calldata info,
        string calldata divisionId,
        uint256 creatorPositionId,
        uint256 positionId,
        Position calldata position
    ) external;

    function updateOfficialInfo(
        address officialAddress,
        OfficialInfo calldata info
    ) external;

    function updateOfficialPosition(
        address officialAddress,
        string calldata divisionId,
        uint256 creatorPositionId,
        uint256 positionId,
        Position calldata position
    ) external;

    function deactivateOfficial(address officialAddress) external;

    function reactivateOfficial(address officialAddress) external;

    function getOfficialInfo(
        address officialAddress
    ) external view returns (Official memory official);

    function getOfficialPosition(
        address officialAddress,
        string calldata divisionId,
        uint256 positionId
    ) external view returns (Position memory position);
}
