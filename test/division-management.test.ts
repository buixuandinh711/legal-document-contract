import { ethers } from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { LegalDocumentManager, LegalDocumentManager__factory } from "../typechain-types";
import { DivisionStatus } from "../utils/contract.type";

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
  });

  describe("Create division", () => {
    it("Should fail if not created by system admin", async () => {
      await expect(
        documentManager
          .connect(other)
          .createDivision(DIVISION_ID, DIVISION_NAME, SUPERVISORY_DIV_ID)
      ).to.be.revertedWithCustomError(documentManager, "NotTheSystemAdmin");
    });

    it("Should succeed to create new division", async () => {
      const tx = await documentManager
        .connect(admin)
        .createDivision(DIVISION_ID, DIVISION_NAME, SUPERVISORY_DIV_ID);
      await tx.wait();

      await expect(tx)
        .to.emit(documentManager, "DivisionCreated")
        .withArgs(DIVISION_ID, DIVISION_NAME, SUPERVISORY_DIV_ID);

      const { name, supervisoryDivId, status } = await documentManager.getDivision(DIVISION_ID);

      expect(name).to.be.equal(DIVISION_NAME);
      expect(supervisoryDivId).to.be.equal(SUPERVISORY_DIV_ID);
      expect(status).to.be.equal(DivisionStatus.ACTIVE);
    });

    it("Should fail if use existed divisionId", async () => {
      const createDivTx = await documentManager
        .connect(admin)
        .createDivision(DIVISION_ID, DIVISION_NAME, SUPERVISORY_DIV_ID);
      await createDivTx.wait();

      await expect(
        documentManager
          .connect(admin)
          .createDivision(DIVISION_ID, DIVISION_NAME, SUPERVISORY_DIV_ID)
      ).to.be.revertedWithCustomError(documentManager, "DivisionAlreadyCreated");
    });
  });

  describe("Update division", () => {
    const NEW_NAME = "UBND Hanoi 2";
    const NEW_SUPERVISORY_ID = "A1";

    beforeEach(async function () {
      if (this.currentTest?.title == "Should fail if update not created division") return;

      const createDivTx = await documentManager
        .connect(admin)
        .createDivision(DIVISION_ID, DIVISION_NAME, SUPERVISORY_DIV_ID);
      await createDivTx.wait();
    });

    it("Should fail if not updated by admin", async () => {
      await expect(
        documentManager.connect(other).updateDivision(DIVISION_ID, NEW_NAME, NEW_SUPERVISORY_ID)
      ).to.be.revertedWithCustomError(documentManager, "NotTheSystemAdmin");
    });

    it("Should fail if update not created division", async () => {
      await expect(
        documentManager.connect(admin).updateDivision(DIVISION_ID, NEW_NAME, NEW_SUPERVISORY_ID)
      ).to.be.revertedWithCustomError(documentManager, "DivisionNotCreated");
    });

    it("Should succeed to update division info", async () => {
      const tx = await documentManager
        .connect(admin)
        .updateDivision(DIVISION_ID, NEW_NAME, NEW_SUPERVISORY_ID);
      await tx.wait();

      await expect(tx)
        .to.emit(documentManager, "DivisionUpdated")
        .withArgs(DIVISION_ID, NEW_NAME, NEW_SUPERVISORY_ID);

      const { name, supervisoryDivId } = await documentManager.getDivision(DIVISION_ID);

      expect(name).to.be.equal(NEW_NAME);
      expect(supervisoryDivId).to.be.equal(NEW_SUPERVISORY_ID);
    });
  });

  describe("Deactivate division", () => {
    beforeEach(async function () {
      if (this.currentTest?.title == "Should fail if deactivate not created division") return;

      const createDivTx = await documentManager
        .connect(admin)
        .createDivision(DIVISION_ID, DIVISION_NAME, SUPERVISORY_DIV_ID);
      await createDivTx.wait();
    });

    it("Should fail if not deactivated by admin", async () => {
      await expect(
        documentManager.connect(other).deactivateDivision(DIVISION_ID)
      ).to.be.revertedWithCustomError(documentManager, "NotTheSystemAdmin");
    });

    it("Should fail if deactivate not created division", async () => {
      await expect(
        documentManager.connect(admin).deactivateDivision(DIVISION_ID)
      ).to.be.revertedWithCustomError(documentManager, "DivisionNotActive");
    });

    it("Should succeed to deactivate division", async () => {
      const tx = await documentManager.connect(admin).deactivateDivision(DIVISION_ID);
      await tx.wait();

      await expect(tx).to.emit(documentManager, "DivisionDeactivated").withArgs(DIVISION_ID);

      const { status } = await documentManager.getDivision(DIVISION_ID);

      expect(status).to.be.equal(DivisionStatus.DEACTIVATED);
    });

    it("Should fail if deactivate division twice", async () => {
      const tx = await documentManager.connect(admin).deactivateDivision(DIVISION_ID);
      await tx.wait();

      await expect(
        documentManager.connect(admin).deactivateDivision(DIVISION_ID)
      ).to.be.revertedWithCustomError(documentManager, "DivisionNotActive");
    });
  });

  describe("Reactivate division", () => {
    beforeEach(async function () {
      if (this.currentTest?.title == "Should fail if reactivate not created division") return;

      const createDivTx = await documentManager
        .connect(admin)
        .createDivision(DIVISION_ID, DIVISION_NAME, SUPERVISORY_DIV_ID);
      await createDivTx.wait();

      const deactivateDivTx = await documentManager.connect(admin).deactivateDivision(DIVISION_ID);
      await deactivateDivTx.wait();
    });

    it("Should fail if not reactivated by admin", async () => {
      await expect(
        documentManager.connect(other).reactivateDivision(DIVISION_ID)
      ).to.be.revertedWithCustomError(documentManager, "NotTheSystemAdmin");
    });

    it("Should fail if reactivate not created division", async () => {
      await expect(
        documentManager.connect(admin).deactivateDivision(DIVISION_ID)
      ).to.be.revertedWithCustomError(documentManager, "DivisionNotActive");
    });

    it("Should succeed to reactivate division", async () => {
      const tx = await documentManager.connect(admin).reactivateDivision(DIVISION_ID);
      await tx.wait();

      await expect(tx).to.emit(documentManager, "DivisionReactivated").withArgs(DIVISION_ID);

      const { status } = await documentManager.getDivision(DIVISION_ID);

      expect(status).to.be.equal(DivisionStatus.ACTIVE);
    });

    it("Should fail if reactivate division twice", async () => {
      const tx = await documentManager.connect(admin).reactivateDivision(DIVISION_ID);
      await tx.wait();

      await expect(
        documentManager.connect(admin).reactivateDivision(DIVISION_ID)
      ).to.be.revertedWithCustomError(documentManager, "DivisionNotDeactivated");
    });
  });
});
