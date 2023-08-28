import { ethers } from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { LegalDocumentManager, LegalDocumentManager__factory } from "../typechain-types";
import { DivisionStatus } from "../types/contract.type";

describe("DivisionManager", () => {
  const SUPERVISORY_DIV_ID = "ROOT";
  const DIVISION_ID = "H26";
  const DIVISION_NAME = "UBND Hanoi";

  let [admin, other]: SignerWithAddress[] = [];
  let documentManager: LegalDocumentManager;

  beforeEach(async () => {
    [admin, other] = await ethers.getSigners();

    documentManager = await new LegalDocumentManager__factory(admin).deploy();
    await documentManager.waitForDeployment();

    const createDivTx = await documentManager
      .connect(admin)
      .createDivision(DIVISION_ID, DIVISION_NAME, SUPERVISORY_DIV_ID);
    await createDivTx.wait();
  });
});
