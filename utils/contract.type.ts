import { IPositionManager, ILegalDocumentManager } from "../typechain-types/LegalDocumentManager";

export enum DivisionStatus {
  NOT_CREATED,
  ACTIVE,
  DEACTIVATED,
}

export enum PositionRole {
  REVOKED,
  DIVISION_ADMIN,
  MANAGER,
  STAFF,
}

export enum OfficerStatus {
  NOT_CREATED,
  ACTIVE,
  DEACTIVATED,
}

export type OfficerPosition = IPositionManager.OfficerPositionStruct;
export type DocumentInfo = ILegalDocumentManager.DocumentInfoStruct;
