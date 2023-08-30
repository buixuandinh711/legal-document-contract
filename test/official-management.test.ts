import { ethers } from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { LegalDocumentManager, LegalDocumentManager__factory } from "../typechain-types";
import { DivisionStatus, OfficialStatus, PositionRole } from "../utils/contract.type";
import { Result } from "ethers";
import { toEthersResult } from "../utils/utils";

describe.only("DivisionManager", () => {
  const SUPERVISORY_DIV_ID = "ROOT";
  const DIVISION_ID = "H26";
  const DIVISION_NAME = "UBND Hanoi";
  const OFFICIAL_ADDRESS = "0x14BbEb5702533e67D9b309927807954E568041E5";
  const OFFICIAL_INFO = {
    name: "Nguyen Van A",
    sex: "Male",
    dateOfBirth: "01/01/2001",
  };
  const OFFICIAL_POSITION = {
    name: "President",
    role: PositionRole.STAFF,
  };
  const ADMIN_POSITION_INDEX = 0;
  const [FIRST_POSITION_INDEX] = [0];

  let [admin, other]: SignerWithAddress[] = [];
  let documentManager: LegalDocumentManager;

  beforeEach(async function () {
    [admin, other] = await ethers.getSigners();

    documentManager = await new LegalDocumentManager__factory(admin).deploy();
    await documentManager.waitForDeployment();

    if (
      this.currentTest !== undefined &&
      this.currentTest.title === "Should fail if division not created yet"
    ) {
      return;
    }

    const createDivTx = await documentManager
      .connect(admin)
      .createDivision(DIVISION_ID, DIVISION_NAME, SUPERVISORY_DIV_ID);
    await createDivTx.wait();
  });

  describe("Call by admin", () => {
    describe("Create official", () => {
      it("Should fail if division not created yet", async () => {
        await expect(
          documentManager
            .connect(admin)
            .createOfficial(
              OFFICIAL_ADDRESS,
              OFFICIAL_INFO,
              DIVISION_ID,
              ADMIN_POSITION_INDEX,
              OFFICIAL_POSITION
            )
        ).to.be.revertedWithCustomError(documentManager, "DivisionNotCreated");
      });

      it("Should revert if create with invalid role", async () => {
        await expect(
          documentManager
            .connect(admin)
            .createOfficial(OFFICIAL_ADDRESS, OFFICIAL_INFO, DIVISION_ID, ADMIN_POSITION_INDEX, {
              name: "President",
              role: PositionRole.REVOKED,
            })
        ).to.be.revertedWithCustomError(documentManager, "InvalidCreatedOfficialRole");
      });

      it("Should succeed to create new official", async () => {
        const createTx = await documentManager
          .connect(admin)
          .createOfficial(
            OFFICIAL_ADDRESS,
            OFFICIAL_INFO,
            DIVISION_ID,
            ADMIN_POSITION_INDEX,
            OFFICIAL_POSITION
          );
        await createTx.wait();

        await expect(createTx)
          .to.emit(documentManager, "OfficialCreated")
          .withArgs(
            OFFICIAL_ADDRESS,
            Result.fromItems(Object.values(OFFICIAL_INFO)),
            DIVISION_ID,
            ADMIN_POSITION_INDEX,
            FIRST_POSITION_INDEX,
            Result.fromItems(Object.values(OFFICIAL_POSITION))
          );

        const { info, status } = await documentManager.getOfficialInfo(OFFICIAL_ADDRESS);
        expect(info).to.be.deep.equal(toEthersResult(OFFICIAL_INFO));
        expect(status).to.be.equal(OfficialStatus.ACTIVE);

        const { name, role } = await documentManager.getOfficialPosition(
          OFFICIAL_ADDRESS,
          DIVISION_ID,
          FIRST_POSITION_INDEX
        );
        expect(name).to.be.equal(OFFICIAL_POSITION.name);
        expect(role).to.be.equal(OFFICIAL_POSITION.role);
      });

      it("Should fail if official address already used", async () => {
        const createTx = await documentManager
          .connect(admin)
          .createOfficial(
            OFFICIAL_ADDRESS,
            OFFICIAL_INFO,
            DIVISION_ID,
            ADMIN_POSITION_INDEX,
            OFFICIAL_POSITION
          );
        await createTx.wait();

        await expect(
          documentManager
            .connect(admin)
            .createOfficial(
              OFFICIAL_ADDRESS,
              OFFICIAL_INFO,
              DIVISION_ID,
              ADMIN_POSITION_INDEX,
              OFFICIAL_POSITION
            )
        ).to.be.revertedWithCustomError(documentManager, "OfficialAlreadyCreated");
      });
    });

    describe("Update official info ", () => {
      const OFFICIAL_NEW_INFO = {
        name: "Tran Van B",
        sex: "Male",
        dateOfBirth: "01/01/2011",
      };

      it("Should fail if official not created yet", async () => {
        await expect(
          documentManager.connect(admin).updateOfficialInfo(OFFICIAL_ADDRESS, OFFICIAL_NEW_INFO)
        ).to.be.revertedWithCustomError(documentManager, "OfficialNotCreated");
      });

      it("Should success to update official info", async () => {
        const createTx = await documentManager
          .connect(admin)
          .createOfficial(
            OFFICIAL_ADDRESS,
            OFFICIAL_INFO,
            DIVISION_ID,
            ADMIN_POSITION_INDEX,
            OFFICIAL_POSITION
          );
        await createTx.wait();

        const updateTx = await documentManager
          .connect(admin)
          .updateOfficialInfo(OFFICIAL_ADDRESS, OFFICIAL_NEW_INFO);
        await updateTx.wait();

        await expect(updateTx)
          .to.emit(documentManager, "OfficialInfoUpdated")
          .withArgs(OFFICIAL_ADDRESS, toEthersResult(OFFICIAL_NEW_INFO));

        const { info: updatedInfo } = await documentManager.getOfficialInfo(OFFICIAL_ADDRESS);
        expect(updatedInfo).to.be.deep.equal(toEthersResult(OFFICIAL_NEW_INFO));
      });
    });

    describe("Deactivate official ", () => {
      beforeEach(async function () {
        if (
          this.currentTest !== undefined &&
          this.currentTest.title === "Should fail if deactivate not created official"
        )
          return;

        const createTx = await documentManager
          .connect(admin)
          .createOfficial(
            OFFICIAL_ADDRESS,
            OFFICIAL_INFO,
            DIVISION_ID,
            ADMIN_POSITION_INDEX,
            OFFICIAL_POSITION
          );
        await createTx.wait();
      });

      it("Should fail if deactivate not created official", async () => {
        await expect(
          documentManager.connect(admin).deactivateOfficial(OFFICIAL_ADDRESS)
        ).to.be.revertedWithCustomError(documentManager, "OfficialNotActive");
      });

      it("Should success to deactivate official", async () => {
        const deactivateTx = await documentManager
          .connect(admin)
          .deactivateOfficial(OFFICIAL_ADDRESS);
        await deactivateTx.wait();

        await expect(deactivateTx)
          .to.emit(documentManager, "OfficialDeactivated")
          .withArgs(OFFICIAL_ADDRESS);

        const { status } = await documentManager.getOfficialInfo(OFFICIAL_ADDRESS);
        expect(status).to.be.equal(OfficialStatus.DEACTIVATED);
      });

      it("Should fail if deactivate official twice", async () => {
        const deactivateTx = await documentManager
          .connect(admin)
          .deactivateOfficial(OFFICIAL_ADDRESS);
        await deactivateTx.wait();

        await expect(
          documentManager.connect(admin).deactivateOfficial(OFFICIAL_ADDRESS)
        ).to.be.revertedWithCustomError(documentManager, "OfficialNotActive");
      });
    });

    describe("Reactivate official ", () => {
      beforeEach(async function () {
        if (
          this.currentTest !== undefined &&
          this.currentTest.title === "Should fail if reactivate not created official"
        )
          return;

        const createTx = await documentManager
          .connect(admin)
          .createOfficial(
            OFFICIAL_ADDRESS,
            OFFICIAL_INFO,
            DIVISION_ID,
            ADMIN_POSITION_INDEX,
            OFFICIAL_POSITION
          );
        await createTx.wait();
      });

      it("Should fail if reactivate not created official", async () => {
        await expect(
          documentManager.connect(admin).reactivateOfficial(OFFICIAL_ADDRESS)
        ).to.be.revertedWithCustomError(documentManager, "OfficialNotDeactivated");
      });

      it("Should fail if reactivate active official", async () => {
        await expect(
          documentManager.connect(admin).reactivateOfficial(OFFICIAL_ADDRESS)
        ).to.be.revertedWithCustomError(documentManager, "OfficialNotDeactivated");
      });

      it("Should success to reactivate official", async () => {
        const deactivateTx = await documentManager
          .connect(admin)
          .deactivateOfficial(OFFICIAL_ADDRESS);
        await deactivateTx.wait();

        const reactivateTx = await documentManager
          .connect(admin)
          .reactivateOfficial(OFFICIAL_ADDRESS);
        await reactivateTx.wait();

        await expect(reactivateTx)
          .to.emit(documentManager, "OfficialReactivated")
          .withArgs(OFFICIAL_ADDRESS);

        const { status } = await documentManager.getOfficialInfo(OFFICIAL_ADDRESS);
        expect(status).to.be.equal(OfficialStatus.ACTIVE);
      });
    });
  });
});
