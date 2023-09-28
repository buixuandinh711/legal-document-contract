import { ethers } from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { LegalDocumentManager, LegalDocumentManager__factory } from "../typechain-types";
import { OfficerStatus } from "../utils/contract.type";
import { toEthersResult } from "../utils/utils";

describe("OfficerManager", () => {
  const OFFICER_ADDRESS = "0x14BbEb5702533e67D9b309927807954E568041E5";
  const OFFICER_INFO = {
    name: "Nguyen Van A",
    sex: "Male",
    dateOfBirth: "01/01/2001",
  };
  const NOT_CREATE_OFFICER = "0xA83722f7d0223C5E0459B10776A15156408Be705";

  let admin: SignerWithAddress;
  let other: SignerWithAddress;
  let documentManager: LegalDocumentManager;

  beforeEach(async function () {
    [admin, other] = await ethers.getSigners();

    documentManager = await new LegalDocumentManager__factory(admin).deploy();
    await documentManager.waitForDeployment();
  });

  describe("Create officer", () => {
    it("Should fail if not called by the system admin", async () => {
      await expect(
        documentManager.connect(other).createOfficer(OFFICER_ADDRESS, OFFICER_INFO)
      ).to.be.revertedWithCustomError(documentManager, "NotTheSystemAdmin");
    });

    it("Should succeed to create new officer", async () => {
      const createTx = await documentManager
        .connect(admin)
        .createOfficer(OFFICER_ADDRESS, OFFICER_INFO);
      await createTx.wait();

      await expect(createTx)
        .to.emit(documentManager, "OfficerCreated")
        .withArgs(OFFICER_ADDRESS, toEthersResult(OFFICER_INFO));

      const { info, status } = await documentManager.getOfficerInfo(OFFICER_ADDRESS);
      expect(info).to.be.deep.equal(toEthersResult(OFFICER_INFO));
      expect(status).to.be.equal(OfficerStatus.ACTIVE);
    });

    it("Should fail if officer address already used", async () => {
      const createTx = await documentManager
        .connect(admin)
        .createOfficer(OFFICER_ADDRESS, OFFICER_INFO);
      await createTx.wait();

      await expect(
        documentManager.connect(admin).createOfficer(OFFICER_ADDRESS, OFFICER_INFO)
      ).to.be.revertedWithCustomError(documentManager, "OfficerAlreadyCreated");
    });
  });

  describe("Update officer info ", () => {
    const OFFICER_NEW_INFO = {
      name: "Tran Van B",
      sex: "Male",
      dateOfBirth: "01/01/2011",
    };

    beforeEach(async () => {
      const createTx = await documentManager
        .connect(admin)
        .createOfficer(OFFICER_ADDRESS, OFFICER_INFO);
      await createTx.wait();
    });

    it("Should fail if not called by the system admin", async () => {
      await expect(
        documentManager.connect(other).updateOfficerInfo(OFFICER_ADDRESS, OFFICER_NEW_INFO)
      ).to.be.revertedWithCustomError(documentManager, "NotTheSystemAdmin");
    });

    it("Should fail if officer not created yet", async () => {
      await expect(
        documentManager.connect(admin).updateOfficerInfo(NOT_CREATE_OFFICER, OFFICER_NEW_INFO)
      ).to.be.revertedWithCustomError(documentManager, "OfficerNotCreated");
    });

    it("Should success to update officer info", async () => {
      const updateTx = await documentManager
        .connect(admin)
        .updateOfficerInfo(OFFICER_ADDRESS, OFFICER_NEW_INFO);
      await updateTx.wait();

      await expect(updateTx)
        .to.emit(documentManager, "OfficerInfoUpdated")
        .withArgs(OFFICER_ADDRESS, toEthersResult(OFFICER_NEW_INFO));

      const { info: updatedInfo } = await documentManager.getOfficerInfo(OFFICER_ADDRESS);
      expect(updatedInfo).to.be.deep.equal(toEthersResult(OFFICER_NEW_INFO));
    });
  });

  describe("Deactivate officer ", () => {
    beforeEach(async function () {
      const createTx = await documentManager
        .connect(admin)
        .createOfficer(OFFICER_ADDRESS, OFFICER_INFO);
      await createTx.wait();
    });

    it("Should fail if not called by the system admin", async () => {
      await expect(
        documentManager.connect(other).deactivateOfficer(OFFICER_ADDRESS)
      ).to.be.revertedWithCustomError(documentManager, "NotTheSystemAdmin");
    });

    it("Should fail if deactivate not created officer", async () => {
      await expect(
        documentManager.connect(admin).deactivateOfficer(NOT_CREATE_OFFICER)
      ).to.be.revertedWithCustomError(documentManager, "OfficerNotActive");
    });

    it("Should success to deactivate officer", async () => {
      const deactivateTx = await documentManager.connect(admin).deactivateOfficer(OFFICER_ADDRESS);
      await deactivateTx.wait();

      await expect(deactivateTx)
        .to.emit(documentManager, "OfficerDeactivated")
        .withArgs(OFFICER_ADDRESS);

      const { status } = await documentManager.getOfficerInfo(OFFICER_ADDRESS);
      expect(status).to.be.equal(OfficerStatus.DEACTIVATED);
    });

    it("Should fail if deactivate officer twice", async () => {
      const deactivateTx = await documentManager.connect(admin).deactivateOfficer(OFFICER_ADDRESS);
      await deactivateTx.wait();

      await expect(
        documentManager.connect(admin).deactivateOfficer(OFFICER_ADDRESS)
      ).to.be.revertedWithCustomError(documentManager, "OfficerNotActive");
    });
  });

  describe("Reactivate officer ", () => {
    beforeEach(async function () {
      const createTx = await documentManager
        .connect(admin)
        .createOfficer(OFFICER_ADDRESS, OFFICER_INFO);
      await createTx.wait();

      if (this.currentTest?.title == "Should fail if reactivate active officer") return;

      const deactivateTx = await documentManager.connect(admin).deactivateOfficer(OFFICER_ADDRESS);
      await deactivateTx.wait();
    });

    it("Should fail if not called by the system admin", async () => {
      await expect(
        documentManager.connect(other).reactivateDivision(OFFICER_ADDRESS)
      ).to.be.revertedWithCustomError(documentManager, "NotTheSystemAdmin");
    });

    it("Should fail if reactivate not created officer", async () => {
      await expect(
        documentManager.connect(admin).reactivateOfficer(NOT_CREATE_OFFICER)
      ).to.be.revertedWithCustomError(documentManager, "OfficerNotDeactivated");
    });

    it("Should fail if reactivate active officer", async () => {
      await expect(
        documentManager.connect(admin).reactivateOfficer(OFFICER_ADDRESS)
      ).to.be.revertedWithCustomError(documentManager, "OfficerNotDeactivated");
    });

    it("Should success to reactivate officer", async () => {
      const reactivateTx = await documentManager.connect(admin).reactivateOfficer(OFFICER_ADDRESS);
      await reactivateTx.wait();

      await expect(reactivateTx)
        .to.emit(documentManager, "OfficerReactivated")
        .withArgs(OFFICER_ADDRESS);

      const { status } = await documentManager.getOfficerInfo(OFFICER_ADDRESS);
      expect(status).to.be.equal(OfficerStatus.ACTIVE);
    });
  });
});
