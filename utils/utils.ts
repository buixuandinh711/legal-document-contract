import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { Result } from "ethers";
import { ethers } from "hardhat";
import { DocumentInfo, OfficerPosition } from "./contract.type";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const toEthersResult = (obj: any) => {
  return Result.from(Object.values(obj));
};

export const ONE_WEI = 1n;
export const ONE_GWEI = 1e9;
export const ROOT_DIVISION_ID = "ROOT";
export const MAX_POSITION_INDEX = 1000;
export const ADMIN_POSITION_INDEX = 1001;
export const [FIRST_POSITION_INDEX, SECOND_POSITION_INDEX] = [0n, 1n];

export const signDocument = async (
  documentInfo: DocumentInfo,
  documentContent: string,
  signersPosition: OfficerPosition[],
  signers: SignerWithAddress[]
): Promise<string> => {
  if (signersPosition.length != signers.length) throw new Error("Signers length not match");

  let res = "0x";

  const documentContentHash = ethers.keccak256(documentContent);

  for (let i = 0; i < signersPosition.length; i++) {
    const position = signersPosition[i];
    const signer = signers[i];
    const signedInfo = ethers.concat([
      ethers.toUtf8Bytes(position.divisionId),
      ethers.toBeHex(position.positionIndex, 32),
      ethers.toUtf8Bytes(documentInfo.number),
      ethers.toUtf8Bytes(documentInfo.name),
      ethers.toUtf8Bytes(documentInfo.divisionId),
      ethers.toBeHex(documentInfo.publishedTimestamp, 32),
      documentContentHash,
    ]);

    const signedHash = ethers.keccak256(signedInfo);

    const signature = await signer.signMessage(ethers.getBytes(signedHash));
    res += signature.slice(2);
  }

  return res;
};
