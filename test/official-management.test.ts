import { ethers } from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { LegalDocumentManager, LegalDocumentManager__factory } from "../typechain-types";
import { DivisionStatus, OfficialStatus, PositionRole } from "../utils/contract.type";
import { Result } from "ethers";
import { toEthersResult } from "../utils/utils";

describe("OfficialManager", () => {
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
  const [FIRST_POSITION_INDEX, SECOND_POSITION_INDEX] = [0, 1];

  let admin: SignerWithAddress;
  let documentManager: LegalDocumentManager;

  beforeEach(async function () {
    [admin] = await ethers.getSigners();

    documentManager = await new LegalDocumentManager__factory(admin).deploy();
    await documentManager.waitForDeployment();

    const createDivTx = await documentManager
      .connect(admin)
      .createDivision(DIVISION_ID, DIVISION_NAME, SUPERVISORY_DIV_ID);
    await createDivTx.wait();
  });

  describe("Call by admin", () => {
    describe("Create official", () => {
      const NOT_CREATED_DIVISION = "H30";

      it("Should fail if division not created yet", async () => {
        await expect(
          documentManager
            .connect(admin)
            .createOfficial(
              OFFICIAL_ADDRESS,
              OFFICIAL_INFO,
              NOT_CREATED_DIVISION,
              ADMIN_POSITION_INDEX,
              OFFICIAL_POSITION
            )
        ).to.be.revertedWithCustomError(documentManager, "DivisionNotCreated");
      });

      it("Should fail if create with invalid role", async () => {
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

    describe("Update position name", () => {
      const NEW_POSITION_NAME = "Vice President";
      const NOT_CREATE_OFFICIAL = "0xA83722f7d0223C5E0459B10776A15156408Be705";
      const NOT_CREATED_DIVISION = "H31";

      beforeEach(async function () {
        const createOfficialTx = await documentManager
          .connect(admin)
          .createOfficial(
            OFFICIAL_ADDRESS,
            OFFICIAL_INFO,
            DIVISION_ID,
            ADMIN_POSITION_INDEX,
            OFFICIAL_POSITION
          );
        await createOfficialTx.wait();
      });

      it("Should fail to update official name if official not created yet", async () => {
        await expect(
          documentManager
            .connect(admin)
            .updatePositionName(
              NOT_CREATE_OFFICIAL,
              DIVISION_ID,
              ADMIN_POSITION_INDEX,
              FIRST_POSITION_INDEX,
              NEW_POSITION_NAME
            )
        ).to.be.revertedWithCustomError(documentManager, "OfficialNotCreated");
      });

      it("Should fail to update official name if division not created yet", async () => {
        await expect(
          documentManager
            .connect(admin)
            .updatePositionName(
              OFFICIAL_ADDRESS,
              NOT_CREATED_DIVISION,
              ADMIN_POSITION_INDEX,
              FIRST_POSITION_INDEX,
              NEW_POSITION_NAME
            )
        ).to.be.revertedWithCustomError(documentManager, "DivisionNotCreated");
      });

      it("Should fail to update official name if position index invalid", async () => {
        await expect(
          documentManager.connect(admin).updatePositionName(
            OFFICIAL_ADDRESS,
            DIVISION_ID,
            ADMIN_POSITION_INDEX,
            SECOND_POSITION_INDEX, // out of positions array
            NEW_POSITION_NAME
          )
        ).to.be.revertedWithCustomError(documentManager, "PositionIndexOutOfRange");
      });

      it("Should succeed to update official name", async () => {
        const updateNameTx = await documentManager
          .connect(admin)
          .updatePositionName(
            OFFICIAL_ADDRESS,
            DIVISION_ID,
            ADMIN_POSITION_INDEX,
            FIRST_POSITION_INDEX,
            NEW_POSITION_NAME
          );

        await updateNameTx.wait();

        await expect(updateNameTx)
          .to.emit(documentManager, "PositionNameUpdated")
          .withArgs(
            OFFICIAL_ADDRESS,
            DIVISION_ID,
            ADMIN_POSITION_INDEX,
            FIRST_POSITION_INDEX,
            NEW_POSITION_NAME
          );
        const { name } = await documentManager.getOfficialPosition(
          OFFICIAL_ADDRESS,
          DIVISION_ID,
          FIRST_POSITION_INDEX
        );

        expect(name).to.be.equal(NEW_POSITION_NAME);
      });
    });

    describe("Update position role", () => {
      const NEW_POSITION_ROLE = PositionRole.MANAGER;
      const NOT_CREATE_OFFICIAL = "0xA83722f7d0223C5E0459B10776A15156408Be705";
      const NOT_CREATED_DIVISION = "H31";

      beforeEach(async function () {
        const createOfficialTx = await documentManager
          .connect(admin)
          .createOfficial(
            OFFICIAL_ADDRESS,
            OFFICIAL_INFO,
            DIVISION_ID,
            ADMIN_POSITION_INDEX,
            OFFICIAL_POSITION
          );
        await createOfficialTx.wait();
      });

      it("Should fail to update official role if official not created yet", async () => {
        await expect(
          documentManager
            .connect(admin)
            .updatePositionRole(
              NOT_CREATE_OFFICIAL,
              DIVISION_ID,
              ADMIN_POSITION_INDEX,
              FIRST_POSITION_INDEX,
              NEW_POSITION_ROLE
            )
        ).to.be.revertedWithCustomError(documentManager, "OfficialNotCreated");
      });

      it("Should fail to update official role if division not created yet", async () => {
        await expect(
          documentManager
            .connect(admin)
            .updatePositionRole(
              OFFICIAL_ADDRESS,
              NOT_CREATED_DIVISION,
              ADMIN_POSITION_INDEX,
              FIRST_POSITION_INDEX,
              NEW_POSITION_ROLE
            )
        ).to.be.revertedWithCustomError(documentManager, "DivisionNotCreated");
      });

      it("Should fail to update official role if position index invalid", async () => {
        await expect(
          documentManager.connect(admin).updatePositionRole(
            OFFICIAL_ADDRESS,
            DIVISION_ID,
            ADMIN_POSITION_INDEX,
            SECOND_POSITION_INDEX, // out of positions array
            NEW_POSITION_ROLE
          )
        ).to.be.revertedWithCustomError(documentManager, "PositionIndexOutOfRange");
      });

      it("Should fail to update official role if new role invalid", async () => {
        await expect(
          documentManager
            .connect(admin)
            .updatePositionRole(
              OFFICIAL_ADDRESS,
              DIVISION_ID,
              ADMIN_POSITION_INDEX,
              FIRST_POSITION_INDEX,
              PositionRole.REVOKED
            )
        ).to.be.revertedWithCustomError(documentManager, "InvalidUpdatedRole");
      });

      it("Should succeed to update official role", async () => {
        const updateNameTx = await documentManager
          .connect(admin)
          .updatePositionRole(
            OFFICIAL_ADDRESS,
            DIVISION_ID,
            ADMIN_POSITION_INDEX,
            FIRST_POSITION_INDEX,
            NEW_POSITION_ROLE
          );

        await updateNameTx.wait();

        await expect(updateNameTx)
          .to.emit(documentManager, "PositionRoleUpdated")
          .withArgs(
            OFFICIAL_ADDRESS,
            DIVISION_ID,
            ADMIN_POSITION_INDEX,
            FIRST_POSITION_INDEX,
            NEW_POSITION_ROLE
          );
        const { role } = await documentManager.getOfficialPosition(
          OFFICIAL_ADDRESS,
          DIVISION_ID,
          FIRST_POSITION_INDEX
        );

        expect(role).to.be.equal(NEW_POSITION_ROLE);
      });
    });

    describe("Revoke position role", () => {
      const NOT_CREATE_OFFICIAL = "0xA83722f7d0223C5E0459B10776A15156408Be705";
      const NOT_CREATED_DIVISION = "H31";

      beforeEach(async function () {
        const createOfficialTx = await documentManager
          .connect(admin)
          .createOfficial(
            OFFICIAL_ADDRESS,
            OFFICIAL_INFO,
            DIVISION_ID,
            ADMIN_POSITION_INDEX,
            OFFICIAL_POSITION
          );
        await createOfficialTx.wait();
      });

      it("Should fail to revoke position role if official not created yet", async () => {
        await expect(
          documentManager
            .connect(admin)
            .revokePositionRole(
              NOT_CREATE_OFFICIAL,
              DIVISION_ID,
              ADMIN_POSITION_INDEX,
              FIRST_POSITION_INDEX
            )
        ).to.be.revertedWithCustomError(documentManager, "OfficialNotCreated");
      });

      it("Should fail to revoke position role if division not created yet", async () => {
        await expect(
          documentManager
            .connect(admin)
            .revokePositionRole(
              OFFICIAL_ADDRESS,
              NOT_CREATED_DIVISION,
              ADMIN_POSITION_INDEX,
              FIRST_POSITION_INDEX
            )
        ).to.be.revertedWithCustomError(documentManager, "DivisionNotCreated");
      });

      it("Should fail to revoke position role if position index invalid", async () => {
        await expect(
          documentManager.connect(admin).revokePositionRole(
            OFFICIAL_ADDRESS,
            DIVISION_ID,
            ADMIN_POSITION_INDEX,
            SECOND_POSITION_INDEX // out of positions array
          )
        ).to.be.revertedWithCustomError(documentManager, "PositionIndexOutOfRange");
      });

      it("Should succeed to revoke position role", async () => {
        const updateNameTx = await documentManager
          .connect(admin)
          .revokePositionRole(
            OFFICIAL_ADDRESS,
            DIVISION_ID,
            ADMIN_POSITION_INDEX,
            FIRST_POSITION_INDEX
          );

        await updateNameTx.wait();

        await expect(updateNameTx)
          .to.emit(documentManager, "PositionRoleRevoked")
          .withArgs(OFFICIAL_ADDRESS, DIVISION_ID, ADMIN_POSITION_INDEX, FIRST_POSITION_INDEX);
        const { role } = await documentManager.getOfficialPosition(
          OFFICIAL_ADDRESS,
          DIVISION_ID,
          FIRST_POSITION_INDEX
        );

        expect(role).to.be.equal(PositionRole.REVOKED);
      });
    });
  });

  describe("Call by division admin", () => {
    const DIV_ADMIN_POSITION_INDEX = FIRST_POSITION_INDEX;

    let divisionAdmin: SignerWithAddress;
    let other: SignerWithAddress;

    beforeEach(async () => {
      [, divisionAdmin, other] = await ethers.getSigners();

      const createDivAdminTx = await documentManager
        .connect(admin)
        .createOfficial(
          divisionAdmin,
          { name: "Nguyen Admin", sex: "Male", dateOfBirth: "01/01/2001" },
          DIVISION_ID,
          ADMIN_POSITION_INDEX,
          { name: "Admin", role: PositionRole.DIVISION_ADMIN }
        );
      await createDivAdminTx.wait();
    });

    describe("Create official", () => {
      it("Should fail to create official if creator not created yet", async () => {
        await expect(
          documentManager
            .connect(other)
            .createOfficial(
              OFFICIAL_ADDRESS,
              OFFICIAL_INFO,
              DIVISION_ID,
              DIV_ADMIN_POSITION_INDEX,
              OFFICIAL_POSITION
            )
        ).to.be.revertedWithCustomError(documentManager, "OfficialNotCreated");
      });

      it("Should fail to create official if division not created yet", async () => {
        const NOT_CREATED_DIVISION = "H30";

        await expect(
          documentManager
            .connect(divisionAdmin)
            .createOfficial(
              OFFICIAL_ADDRESS,
              OFFICIAL_INFO,
              NOT_CREATED_DIVISION,
              DIV_ADMIN_POSITION_INDEX,
              OFFICIAL_POSITION
            )
        ).to.be.revertedWithCustomError(documentManager, "DivisionNotCreated");
      });

      it("Should fail to create official if creator position index invalid", async () => {
        const INVALID_POSITION_INDEX = 2;
        await expect(
          documentManager
            .connect(divisionAdmin)
            .createOfficial(
              OFFICIAL_ADDRESS,
              OFFICIAL_INFO,
              DIVISION_ID,
              INVALID_POSITION_INDEX,
              OFFICIAL_POSITION
            )
        ).to.be.revertedWithCustomError(documentManager, "PositionIndexOutOfRange");
      });

      it("Should fail to create official if division admin deactivated", async () => {
        const deactivateTx = await documentManager.connect(admin).deactivateOfficial(divisionAdmin);
        await deactivateTx.wait();

        await expect(
          documentManager
            .connect(divisionAdmin)
            .createOfficial(
              OFFICIAL_ADDRESS,
              OFFICIAL_INFO,
              DIVISION_ID,
              DIV_ADMIN_POSITION_INDEX,
              OFFICIAL_POSITION
            )
        ).to.be.revertedWithCustomError(documentManager, "NotSystemAdminOrDivisionAdmin");
      });

      it("Should fail to create official if creator not have division admin role", async () => {
        const createOfficialTx = await documentManager
          .connect(admin)
          .createOfficial(
            other,
            { name: "Nguyen Manager", sex: "Male", dateOfBirth: "01/01/2001" },
            DIVISION_ID,
            ADMIN_POSITION_INDEX,
            { name: "Admin", role: PositionRole.MANAGER }
          );
        await createOfficialTx.wait();

        await expect(
          documentManager
            .connect(other)
            .createOfficial(
              OFFICIAL_ADDRESS,
              OFFICIAL_INFO,
              DIVISION_ID,
              DIV_ADMIN_POSITION_INDEX,
              OFFICIAL_POSITION
            )
        ).to.be.revertedWithCustomError(documentManager, "NotSystemAdminOrDivisionAdmin");
      });

      it("Should fail to create official if assign invalid role", async () => {
        await expect(
          documentManager
            .connect(divisionAdmin)
            .createOfficial(
              OFFICIAL_ADDRESS,
              OFFICIAL_INFO,
              DIVISION_ID,
              DIV_ADMIN_POSITION_INDEX,
              {
                name: "President",
                role: PositionRole.REVOKED,
              }
            )
        ).to.be.revertedWithCustomError(documentManager, "InvalidCreatedOfficialRole");
      });

      it("Should succeed to create new official by division admin", async () => {
        const createTx = await documentManager
          .connect(divisionAdmin)
          .createOfficial(
            OFFICIAL_ADDRESS,
            OFFICIAL_INFO,
            DIVISION_ID,
            DIV_ADMIN_POSITION_INDEX,
            OFFICIAL_POSITION
          );
        await createTx.wait();

        await expect(createTx)
          .to.emit(documentManager, "OfficialCreated")
          .withArgs(
            OFFICIAL_ADDRESS,
            Result.fromItems(Object.values(OFFICIAL_INFO)),
            DIVISION_ID,
            DIV_ADMIN_POSITION_INDEX,
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

      it("Should fail to create new official if official address already used", async () => {
        const createTx = await documentManager
          .connect(divisionAdmin)
          .createOfficial(
            OFFICIAL_ADDRESS,
            OFFICIAL_INFO,
            DIVISION_ID,
            DIV_ADMIN_POSITION_INDEX,
            OFFICIAL_POSITION
          );
        await createTx.wait();

        await expect(
          documentManager
            .connect(divisionAdmin)
            .createOfficial(
              OFFICIAL_ADDRESS,
              OFFICIAL_INFO,
              DIVISION_ID,
              DIV_ADMIN_POSITION_INDEX,
              OFFICIAL_POSITION
            )
        ).to.be.revertedWithCustomError(documentManager, "OfficialAlreadyCreated");
      });
    });

    describe("Update position name", () => {
      const POSITION_NEW_NAME = "Vice President";

      beforeEach(async function () {
        const createOfficialTx = await documentManager
          .connect(admin)
          .createOfficial(
            OFFICIAL_ADDRESS,
            OFFICIAL_INFO,
            DIVISION_ID,
            ADMIN_POSITION_INDEX,
            OFFICIAL_POSITION
          );
        await createOfficialTx.wait();
      });

      it("Should fail to update official name if official not created yet", async () => {
        const NOT_CREATE_OFFICIAL = "0xA83722f7d0223C5E0459B10776A15156408Be705";

        await expect(
          documentManager
            .connect(divisionAdmin)
            .updatePositionName(
              NOT_CREATE_OFFICIAL,
              DIVISION_ID,
              DIV_ADMIN_POSITION_INDEX,
              FIRST_POSITION_INDEX,
              POSITION_NEW_NAME
            )
        ).to.be.revertedWithCustomError(documentManager, "OfficialNotCreated");
      });

      it("Should fail to update official name if division not created yet", async () => {
        const NOT_CREATED_DIVISION = "H31";

        await expect(
          documentManager
            .connect(divisionAdmin)
            .updatePositionName(
              OFFICIAL_ADDRESS,
              NOT_CREATED_DIVISION,
              DIV_ADMIN_POSITION_INDEX,
              FIRST_POSITION_INDEX,
              POSITION_NEW_NAME
            )
        ).to.be.revertedWithCustomError(documentManager, "DivisionNotCreated");
      });

      it("Should fail to update official name if position index invalid", async () => {
        await expect(
          documentManager.connect(divisionAdmin).updatePositionName(
            OFFICIAL_ADDRESS,
            DIVISION_ID,
            DIV_ADMIN_POSITION_INDEX,
            SECOND_POSITION_INDEX, // out of positions array
            POSITION_NEW_NAME
          )
        ).to.be.revertedWithCustomError(documentManager, "PositionIndexOutOfRange");
      });

      it("Should fail to update official name if creator not created yet", async () => {
        await expect(
          documentManager
            .connect(other)
            .updatePositionName(
              OFFICIAL_ADDRESS,
              DIVISION_ID,
              DIV_ADMIN_POSITION_INDEX,
              FIRST_POSITION_INDEX,
              POSITION_NEW_NAME
            )
        ).to.be.revertedWithCustomError(documentManager, "OfficialNotCreated");
      });

      it("Should fail to update official name if creator position index invalid", async () => {
        const INVALID_POSITION_INDEX = 2;
        await expect(
          documentManager
            .connect(divisionAdmin)
            .updatePositionName(
              OFFICIAL_ADDRESS,
              DIVISION_ID,
              INVALID_POSITION_INDEX,
              FIRST_POSITION_INDEX,
              POSITION_NEW_NAME
            )
        ).to.be.revertedWithCustomError(documentManager, "PositionIndexOutOfRange");
      });

      it("Should fail to update official name if division admin deactivated", async () => {
        const deactivateTx = await documentManager.connect(admin).deactivateOfficial(divisionAdmin);
        await deactivateTx.wait();

        await expect(
          documentManager
            .connect(divisionAdmin)
            .updatePositionName(
              OFFICIAL_ADDRESS,
              DIVISION_ID,
              DIV_ADMIN_POSITION_INDEX,
              FIRST_POSITION_INDEX,
              POSITION_NEW_NAME
            )
        ).to.be.revertedWithCustomError(documentManager, "NotSystemAdminOrDivisionAdmin");
      });

      it("Should fail to update official name  if creator not have division admin role", async () => {
        const createOfficialTx = await documentManager
          .connect(admin)
          .createOfficial(
            other,
            { name: "Nguyen Manager", sex: "Male", dateOfBirth: "01/01/2001" },
            DIVISION_ID,
            ADMIN_POSITION_INDEX,
            { name: "Admin", role: PositionRole.MANAGER }
          );
        await createOfficialTx.wait();

        await expect(
          documentManager
            .connect(other)
            .updatePositionName(
              OFFICIAL_ADDRESS,
              DIVISION_ID,
              DIV_ADMIN_POSITION_INDEX,
              FIRST_POSITION_INDEX,
              POSITION_NEW_NAME
            )
        ).to.be.revertedWithCustomError(documentManager, "NotSystemAdminOrDivisionAdmin");
      });

      it("Should succeed to update official name", async () => {
        const updateNameTx = await documentManager
          .connect(divisionAdmin)
          .updatePositionName(
            OFFICIAL_ADDRESS,
            DIVISION_ID,
            DIV_ADMIN_POSITION_INDEX,
            FIRST_POSITION_INDEX,
            POSITION_NEW_NAME
          );

        await updateNameTx.wait();

        await expect(updateNameTx)
          .to.emit(documentManager, "PositionNameUpdated")
          .withArgs(
            OFFICIAL_ADDRESS,
            DIVISION_ID,
            ADMIN_POSITION_INDEX,
            FIRST_POSITION_INDEX,
            POSITION_NEW_NAME
          );
        const { name } = await documentManager.getOfficialPosition(
          OFFICIAL_ADDRESS,
          DIVISION_ID,
          FIRST_POSITION_INDEX
        );

        expect(name).to.be.equal(POSITION_NEW_NAME);
      });
    });

    describe("Update position role", () => {
      const POSITION_NEW_ROLE = PositionRole.MANAGER;

      beforeEach(async function () {
        const createOfficialTx = await documentManager
          .connect(admin)
          .createOfficial(
            OFFICIAL_ADDRESS,
            OFFICIAL_INFO,
            DIVISION_ID,
            ADMIN_POSITION_INDEX,
            OFFICIAL_POSITION
          );
        await createOfficialTx.wait();
      });

      it("Should fail to update official role if official not created yet", async () => {
        const NOT_CREATE_OFFICIAL = "0xA83722f7d0223C5E0459B10776A15156408Be705";

        await expect(
          documentManager
            .connect(divisionAdmin)
            .updatePositionRole(
              NOT_CREATE_OFFICIAL,
              DIVISION_ID,
              DIV_ADMIN_POSITION_INDEX,
              FIRST_POSITION_INDEX,
              POSITION_NEW_ROLE
            )
        ).to.be.revertedWithCustomError(documentManager, "OfficialNotCreated");
      });

      it("Should fail to update official role if division not created yet", async () => {
        const NOT_CREATED_DIVISION = "H31";

        await expect(
          documentManager
            .connect(divisionAdmin)
            .updatePositionRole(
              OFFICIAL_ADDRESS,
              NOT_CREATED_DIVISION,
              DIV_ADMIN_POSITION_INDEX,
              FIRST_POSITION_INDEX,
              POSITION_NEW_ROLE
            )
        ).to.be.revertedWithCustomError(documentManager, "DivisionNotCreated");
      });

      it("Should fail to update official role if position index invalid", async () => {
        await expect(
          documentManager.connect(divisionAdmin).updatePositionRole(
            OFFICIAL_ADDRESS,
            DIVISION_ID,
            DIV_ADMIN_POSITION_INDEX,
            SECOND_POSITION_INDEX, // out of positions array
            POSITION_NEW_ROLE
          )
        ).to.be.revertedWithCustomError(documentManager, "PositionIndexOutOfRange");
      });

      it("Should fail to update official role if creator not created yet", async () => {
        await expect(
          documentManager
            .connect(other)
            .updatePositionRole(
              OFFICIAL_ADDRESS,
              DIVISION_ID,
              DIV_ADMIN_POSITION_INDEX,
              FIRST_POSITION_INDEX,
              POSITION_NEW_ROLE
            )
        ).to.be.revertedWithCustomError(documentManager, "OfficialNotCreated");
      });

      it("Should fail to update official role if creator position index invalid", async () => {
        const INVALID_POSITION_INDEX = 2;
        await expect(
          documentManager
            .connect(divisionAdmin)
            .updatePositionRole(
              OFFICIAL_ADDRESS,
              DIVISION_ID,
              INVALID_POSITION_INDEX,
              FIRST_POSITION_INDEX,
              POSITION_NEW_ROLE
            )
        ).to.be.revertedWithCustomError(documentManager, "PositionIndexOutOfRange");
      });

      it("Should fail to update official role if division admin deactivated", async () => {
        const deactivateTx = await documentManager.connect(admin).deactivateOfficial(divisionAdmin);
        await deactivateTx.wait();

        await expect(
          documentManager
            .connect(divisionAdmin)
            .updatePositionRole(
              OFFICIAL_ADDRESS,
              DIVISION_ID,
              DIV_ADMIN_POSITION_INDEX,
              FIRST_POSITION_INDEX,
              POSITION_NEW_ROLE
            )
        ).to.be.revertedWithCustomError(documentManager, "NotSystemAdminOrDivisionAdmin");
      });

      it("Should fail to update official role if creator not have division admin role", async () => {
        const createOfficialTx = await documentManager
          .connect(admin)
          .createOfficial(
            other,
            { name: "Nguyen Manager", sex: "Male", dateOfBirth: "01/01/2001" },
            DIVISION_ID,
            ADMIN_POSITION_INDEX,
            { name: "Admin", role: PositionRole.MANAGER }
          );
        await createOfficialTx.wait();

        await expect(
          documentManager
            .connect(other)
            .updatePositionRole(
              OFFICIAL_ADDRESS,
              DIVISION_ID,
              DIV_ADMIN_POSITION_INDEX,
              FIRST_POSITION_INDEX,
              POSITION_NEW_ROLE
            )
        ).to.be.revertedWithCustomError(documentManager, "NotSystemAdminOrDivisionAdmin");
      });

      it("Should fail to update official role if new role invalid", async () => {
        await expect(
          documentManager
            .connect(divisionAdmin)
            .updatePositionRole(
              OFFICIAL_ADDRESS,
              DIVISION_ID,
              DIV_ADMIN_POSITION_INDEX,
              FIRST_POSITION_INDEX,
              PositionRole.REVOKED
            )
        ).to.be.revertedWithCustomError(documentManager, "InvalidUpdatedRole");
      });

      it("Should succeed to update official role", async () => {
        const updateNameTx = await documentManager
          .connect(divisionAdmin)
          .updatePositionRole(
            OFFICIAL_ADDRESS,
            DIVISION_ID,
            DIV_ADMIN_POSITION_INDEX,
            FIRST_POSITION_INDEX,
            POSITION_NEW_ROLE
          );

        await updateNameTx.wait();

        await expect(updateNameTx)
          .to.emit(documentManager, "PositionRoleUpdated")
          .withArgs(
            OFFICIAL_ADDRESS,
            DIVISION_ID,
            ADMIN_POSITION_INDEX,
            FIRST_POSITION_INDEX,
            POSITION_NEW_ROLE
          );

        const { role } = await documentManager.getOfficialPosition(
          OFFICIAL_ADDRESS,
          DIVISION_ID,
          FIRST_POSITION_INDEX
        );

        expect(role).to.be.equal(POSITION_NEW_ROLE);
      });
    });

    describe("Revoke position role", () => {
      beforeEach(async function () {
        const createOfficialTx = await documentManager
          .connect(admin)
          .createOfficial(
            OFFICIAL_ADDRESS,
            OFFICIAL_INFO,
            DIVISION_ID,
            ADMIN_POSITION_INDEX,
            OFFICIAL_POSITION
          );
        await createOfficialTx.wait();
      });

      it("Should fail to revoke position role if official not created yet", async () => {
        const NOT_CREATE_OFFICIAL = "0xA83722f7d0223C5E0459B10776A15156408Be705";

        await expect(
          documentManager
            .connect(divisionAdmin)
            .revokePositionRole(
              NOT_CREATE_OFFICIAL,
              DIVISION_ID,
              DIV_ADMIN_POSITION_INDEX,
              FIRST_POSITION_INDEX
            )
        ).to.be.revertedWithCustomError(documentManager, "OfficialNotCreated");
      });

      it("Should fail to revoke position role if division not created yet", async () => {
        const NOT_CREATED_DIVISION = "H31";

        await expect(
          documentManager
            .connect(divisionAdmin)
            .revokePositionRole(
              OFFICIAL_ADDRESS,
              NOT_CREATED_DIVISION,
              DIV_ADMIN_POSITION_INDEX,
              FIRST_POSITION_INDEX
            )
        ).to.be.revertedWithCustomError(documentManager, "DivisionNotCreated");
      });

      it("Should fail to revoke position role if position index invalid", async () => {
        await expect(
          documentManager.connect(divisionAdmin).revokePositionRole(
            OFFICIAL_ADDRESS,
            DIVISION_ID,
            DIV_ADMIN_POSITION_INDEX,
            SECOND_POSITION_INDEX // out of positions array
          )
        ).to.be.revertedWithCustomError(documentManager, "PositionIndexOutOfRange");
      });

      it("Should fail to revoke position role if creator not created yet", async () => {
        await expect(
          documentManager
            .connect(other)
            .revokePositionRole(
              OFFICIAL_ADDRESS,
              DIVISION_ID,
              DIV_ADMIN_POSITION_INDEX,
              FIRST_POSITION_INDEX
            )
        ).to.be.revertedWithCustomError(documentManager, "OfficialNotCreated");
      });

      it("Should fail to revoke position role if creator position index invalid", async () => {
        const INVALID_POSITION_INDEX = 2;
        await expect(
          documentManager
            .connect(divisionAdmin)
            .revokePositionRole(
              OFFICIAL_ADDRESS,
              DIVISION_ID,
              INVALID_POSITION_INDEX,
              FIRST_POSITION_INDEX
            )
        ).to.be.revertedWithCustomError(documentManager, "PositionIndexOutOfRange");
      });

      it("Should fail to revoke position role if division admin deactivated", async () => {
        const deactivateTx = await documentManager.connect(admin).deactivateOfficial(divisionAdmin);
        await deactivateTx.wait();

        await expect(
          documentManager
            .connect(divisionAdmin)
            .revokePositionRole(
              OFFICIAL_ADDRESS,
              DIVISION_ID,
              DIV_ADMIN_POSITION_INDEX,
              FIRST_POSITION_INDEX
            )
        ).to.be.revertedWithCustomError(documentManager, "NotSystemAdminOrDivisionAdmin");
      });

      it("Should fail to revoke position role if creator not have division admin role", async () => {
        const createOfficialTx = await documentManager
          .connect(admin)
          .createOfficial(
            other,
            { name: "Nguyen Manager", sex: "Male", dateOfBirth: "01/01/2001" },
            DIVISION_ID,
            ADMIN_POSITION_INDEX,
            { name: "Admin", role: PositionRole.MANAGER }
          );
        await createOfficialTx.wait();

        await expect(
          documentManager
            .connect(other)
            .revokePositionRole(
              OFFICIAL_ADDRESS,
              DIVISION_ID,
              DIV_ADMIN_POSITION_INDEX,
              FIRST_POSITION_INDEX
            )
        ).to.be.revertedWithCustomError(documentManager, "NotSystemAdminOrDivisionAdmin");
      });

      it("Should succeed to revoke position role", async () => {
        const updateNameTx = await documentManager
          .connect(divisionAdmin)
          .revokePositionRole(
            OFFICIAL_ADDRESS,
            DIVISION_ID,
            DIV_ADMIN_POSITION_INDEX,
            FIRST_POSITION_INDEX
          );

        await updateNameTx.wait();

        await expect(updateNameTx)
          .to.emit(documentManager, "PositionRoleRevoked")
          .withArgs(OFFICIAL_ADDRESS, DIVISION_ID, ADMIN_POSITION_INDEX, FIRST_POSITION_INDEX);

        const { role } = await documentManager.getOfficialPosition(
          OFFICIAL_ADDRESS,
          DIVISION_ID,
          FIRST_POSITION_INDEX
        );

        expect(role).to.be.equal(PositionRole.REVOKED);
      });
    });
  });
});
