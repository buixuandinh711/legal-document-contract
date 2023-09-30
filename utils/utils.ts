import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { Result } from "ethers";
import { ethers } from "hardhat";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const toEthersResult = (obj: any) => {
  return Result.from(Object.values(obj));
};

export const ONE_WEI = 1n;
export const ONE_GWEI = 1e9;
export const ROOT_DIVISION_ID = "";
export const MAX_POSITION_INDEX = 1000;
export const ADMIN_POSITION_INDEX = 1001;

export const signDocument = async (
  documentContent: string,
  signers: SignerWithAddress[]
): Promise<string> => {
  let res = "0x";

  const documentHash = ethers.keccak256(documentContent);

  for (const signer of signers) {
    const signature = await signer.signMessage(ethers.getBytes(documentHash));
    res += signature.slice(2);
  }

  return res;
};
