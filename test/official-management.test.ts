import { ethers } from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { LegalDocumentManager, LegalDocumentManager__factory } from "../typechain-types";
import { OfficerStatus, PositionRole } from "../utils/contract.type";
import { Result } from "ethers";
import { toEthersResult } from "../utils/utils";

describe("OfficerManager", () => {
  const SUPERVISORY_DIV_ID = "ROOT";
  const DIVISION_ID = "H26";
  const DIVISION_NAME = "UBND Hanoi";
  const OFFICER_ADDRESS = "0x14BbEb5702533e67D9b309927807954E568041E5";
  const OFFICER_INFO = {
    name: "Nguyen Van A",
    sex: "Male",
    dateOfBirth: "01/01/2001",
  };
  const OFFICER_POSITION = {
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
    describe("Create officer", () => {
      const NOT_CREATED_DIVISION = "H30";

      it("Should fail if division not created yet", async () => {
        await expect(
          documentManager
            .connect(admin)
            .createOfficer(
              OFFICER_ADDRESS,
              OFFICER_INFO,
              NOT_CREATED_DIVISION,
              ADMIN_POSITION_INDEX,
              OFFICER_POSITION
            )
        ).to.be.revertedWithCustomError(documentManager, "DivisionNotCreated");
      });

      it("Should fail if create with invalid role", async () => {
        await expect(
          documentManager
            .connect(admin)
            .createOfficer(OFFICER_ADDRESS, OFFICER_INFO, DIVISION_ID, ADMIN_POSITION_INDEX, {
              name: "President",
              role: PositionRole.REVOKED,
            })
        ).to.be.revertedWithCustomError(documentManager, "InvalidCreatedOfficerRole");
      });

      it("Should succeed to create new officer", async () => {
        const createTx = await documentManager
          .connect(admin)
          .createOfficer(
            OFFICER_ADDRESS,
            OFFICER_INFO,
            DIVISION_ID,
            ADMIN_POSITION_INDEX,
            OFFICER_POSITION
          );
        await createTx.wait();

        await expect(createTx)
          .to.emit(documentManager, "OfficerCreated")
          .withArgs(
            OFFICER_ADDRESS,
            Result.fromItems(Object.values(OFFICER_INFO)),
            DIVISION_ID,
            ADMIN_POSITION_INDEX,
            FIRST_POSITION_INDEX,
            Result.fromItems(Object.values(OFFICER_POSITION))
          );

        const { info, status } = await documentManager.getOfficerInfo(OFFICER_ADDRESS);
        expect(info).to.be.deep.equal(toEthersResult(OFFICER_INFO));
        expect(status).to.be.equal(OfficerStatus.ACTIVE);

        const { name, role } = await documentManager.getOfficerPosition(
          OFFICER_ADDRESS,
          DIVISION_ID,
          FIRST_POSITION_INDEX
        );
        expect(name).to.be.equal(OFFICER_POSITION.name);
        expect(role).to.be.equal(OFFICER_POSITION.role);
      });

      it("Should fail if officer address already used", async () => {
        const createTx = await documentManager
          .connect(admin)
          .createOfficer(
            OFFICER_ADDRESS,
            OFFICER_INFO,
            DIVISION_ID,
            ADMIN_POSITION_INDEX,
            OFFICER_POSITION
          );
        await createTx.wait();

        await expect(
          documentManager
            .connect(admin)
            .createOfficer(
              OFFICER_ADDRESS,
              OFFICER_INFO,
              DIVISION_ID,
              ADMIN_POSITION_INDEX,
              OFFICER_POSITION
            )
        ).to.be.revertedWithCustomError(documentManager, "OfficerAlreadyCreated");
      });
    });

    describe("Update officer info ", () => {
      const OFFICER_NEW_INFO = {
        name: "Tran Van B",
        sex: "Male",
        dateOfBirth: "01/01/2011",
      };

      it("Should fail if officer not created yet", async () => {
        await expect(
          documentManager.connect(admin).updateOfficerInfo(OFFICER_ADDRESS, OFFICER_NEW_INFO)
        ).to.be.revertedWithCustomError(documentManager, "OfficerNotCreated");
      });

      it("Should success to update officer info", async () => {
        const createTx = await documentManager
          .connect(admin)
          .createOfficer(
            OFFICER_ADDRESS,
            OFFICER_INFO,
            DIVISION_ID,
            ADMIN_POSITION_INDEX,
            OFFICER_POSITION
          );
        await createTx.wait();

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
        if (
          this.currentTest !== undefined &&
          this.currentTest.title === "Should fail if deactivate not created officer"
        )
          return;

        const createTx = await documentManager
          .connect(admin)
          .createOfficer(
            OFFICER_ADDRESS,
            OFFICER_INFO,
            DIVISION_ID,
            ADMIN_POSITION_INDEX,
            OFFICER_POSITION
          );
        await createTx.wait();
      });

      it("Should fail if deactivate not created officer", async () => {
        await expect(
          documentManager.connect(admin).deactivateOfficer(OFFICER_ADDRESS)
        ).to.be.revertedWithCustomError(documentManager, "OfficerNotActive");
      });

      it("Should success to deactivate officer", async () => {
        const deactivateTx = await documentManager
          .connect(admin)
          .deactivateOfficer(OFFICER_ADDRESS);
        await deactivateTx.wait();

        await expect(deactivateTx)
          .to.emit(documentManager, "OfficerDeactivated")
          .withArgs(OFFICER_ADDRESS);

        const { status } = await documentManager.getOfficerInfo(OFFICER_ADDRESS);
        expect(status).to.be.equal(OfficerStatus.DEACTIVATED);
      });

      it("Should fail if deactivate officer twice", async () => {
        const deactivateTx = await documentManager
          .connect(admin)
          .deactivateOfficer(OFFICER_ADDRESS);
        await deactivateTx.wait();

        await expect(
          documentManager.connect(admin).deactivateOfficer(OFFICER_ADDRESS)
        ).to.be.revertedWithCustomError(documentManager, "OfficerNotActive");
      });
    });

    describe("Reactivate officer ", () => {
      beforeEach(async function () {
        if (
          this.currentTest !== undefined &&
          this.currentTest.title === "Should fail if reactivate not created officer"
        )
          return;

        const createTx = await documentManager
          .connect(admin)
          .createOfficer(
            OFFICER_ADDRESS,
            OFFICER_INFO,
            DIVISION_ID,
            ADMIN_POSITION_INDEX,
            OFFICER_POSITION
          );
        await createTx.wait();
      });

      it("Should fail if reactivate not created officer", async () => {
        await expect(
          documentManager.connect(admin).reactivateOfficer(OFFICER_ADDRESS)
        ).to.be.revertedWithCustomError(documentManager, "OfficerNotDeactivated");
      });

      it("Should fail if reactivate active officer", async () => {
        await expect(
          documentManager.connect(admin).reactivateOfficer(OFFICER_ADDRESS)
        ).to.be.revertedWithCustomError(documentManager, "OfficerNotDeactivated");
      });

      it("Should success to reactivate officer", async () => {
        const deactivateTx = await documentManager
          .connect(admin)
          .deactivateOfficer(OFFICER_ADDRESS);
        await deactivateTx.wait();

        const reactivateTx = await documentManager
          .connect(admin)
          .reactivateOfficer(OFFICER_ADDRESS);
        await reactivateTx.wait();

        await expect(reactivateTx)
          .to.emit(documentManager, "OfficerReactivated")
          .withArgs(OFFICER_ADDRESS);

        const { status } = await documentManager.getOfficerInfo(OFFICER_ADDRESS);
        expect(status).to.be.equal(OfficerStatus.ACTIVE);
      });
    });

    describe("Update position name", () => {
      const NEW_POSITION_NAME = "Vice President";
      const NOT_CREATE_OFFICER = "0xA83722f7d0223C5E0459B10776A15156408Be705";
      const NOT_CREATED_DIVISION = "H31";

      beforeEach(async function () {
        const createOfficerTx = await documentManager
          .connect(admin)
          .createOfficer(
            OFFICER_ADDRESS,
            OFFICER_INFO,
            DIVISION_ID,
            ADMIN_POSITION_INDEX,
            OFFICER_POSITION
          );
        await createOfficerTx.wait();
      });

      it("Should fail to update officer name if officer not created yet", async () => {
        await expect(
          documentManager
            .connect(admin)
            .updatePositionName(
              NOT_CREATE_OFFICER,
              DIVISION_ID,
              ADMIN_POSITION_INDEX,
              FIRST_POSITION_INDEX,
              NEW_POSITION_NAME
            )
        ).to.be.revertedWithCustomError(documentManager, "OfficerNotCreated");
      });

      it("Should fail to update officer name if division not created yet", async () => {
        await expect(
          documentManager
            .connect(admin)
            .updatePositionName(
              OFFICER_ADDRESS,
              NOT_CREATED_DIVISION,
              ADMIN_POSITION_INDEX,
              FIRST_POSITION_INDEX,
              NEW_POSITION_NAME
            )
        ).to.be.revertedWithCustomError(documentManager, "DivisionNotCreated");
      });

      it("Should fail to update officer name if position index invalid", async () => {
        await expect(
          documentManager.connect(admin).updatePositionName(
            OFFICER_ADDRESS,
            DIVISION_ID,
            ADMIN_POSITION_INDEX,
            SECOND_POSITION_INDEX, // out of positions array
            NEW_POSITION_NAME
          )
        ).to.be.revertedWithCustomError(documentManager, "PositionIndexOutOfRange");
      });

      it("Should succeed to update officer name", async () => {
        const updateNameTx = await documentManager
          .connect(admin)
          .updatePositionName(
            OFFICER_ADDRESS,
            DIVISION_ID,
            ADMIN_POSITION_INDEX,
            FIRST_POSITION_INDEX,
            NEW_POSITION_NAME
          );

        await updateNameTx.wait();

        await expect(updateNameTx)
          .to.emit(documentManager, "PositionNameUpdated")
          .withArgs(
            OFFICER_ADDRESS,
            DIVISION_ID,
            ADMIN_POSITION_INDEX,
            FIRST_POSITION_INDEX,
            NEW_POSITION_NAME
          );
        const { name } = await documentManager.getOfficerPosition(
          OFFICER_ADDRESS,
          DIVISION_ID,
          FIRST_POSITION_INDEX
        );

        expect(name).to.be.equal(NEW_POSITION_NAME);
      });
    });

    describe("Update position role", () => {
      const NEW_POSITION_ROLE = PositionRole.MANAGER;
      const NOT_CREATE_OFFICER = "0xA83722f7d0223C5E0459B10776A15156408Be705";
      const NOT_CREATED_DIVISION = "H31";

      beforeEach(async function () {
        const createOfficerTx = await documentManager
          .connect(admin)
          .createOfficer(
            OFFICER_ADDRESS,
            OFFICER_INFO,
            DIVISION_ID,
            ADMIN_POSITION_INDEX,
            OFFICER_POSITION
          );
        await createOfficerTx.wait();
      });

      it("Should fail to update officer role if officer not created yet", async () => {
        await expect(
          documentManager
            .connect(admin)
            .updatePositionRole(
              NOT_CREATE_OFFICER,
              DIVISION_ID,
              ADMIN_POSITION_INDEX,
              FIRST_POSITION_INDEX,
              NEW_POSITION_ROLE
            )
        ).to.be.revertedWithCustomError(documentManager, "OfficerNotCreated");
      });

      it("Should fail to update officer role if division not created yet", async () => {
        await expect(
          documentManager
            .connect(admin)
            .updatePositionRole(
              OFFICER_ADDRESS,
              NOT_CREATED_DIVISION,
              ADMIN_POSITION_INDEX,
              FIRST_POSITION_INDEX,
              NEW_POSITION_ROLE
            )
        ).to.be.revertedWithCustomError(documentManager, "DivisionNotCreated");
      });

      it("Should fail to update officer role if position index invalid", async () => {
        await expect(
          documentManager.connect(admin).updatePositionRole(
            OFFICER_ADDRESS,
            DIVISION_ID,
            ADMIN_POSITION_INDEX,
            SECOND_POSITION_INDEX, // out of positions array
            NEW_POSITION_ROLE
          )
        ).to.be.revertedWithCustomError(documentManager, "PositionIndexOutOfRange");
      });

      it("Should fail to update officer role if new role invalid", async () => {
        await expect(
          documentManager
            .connect(admin)
            .updatePositionRole(
              OFFICER_ADDRESS,
              DIVISION_ID,
              ADMIN_POSITION_INDEX,
              FIRST_POSITION_INDEX,
              PositionRole.REVOKED
            )
        ).to.be.revertedWithCustomError(documentManager, "InvalidUpdatedRole");
      });

      it("Should succeed to update officer role", async () => {
        const updateNameTx = await documentManager
          .connect(admin)
          .updatePositionRole(
            OFFICER_ADDRESS,
            DIVISION_ID,
            ADMIN_POSITION_INDEX,
            FIRST_POSITION_INDEX,
            NEW_POSITION_ROLE
          );

        await updateNameTx.wait();

        await expect(updateNameTx)
          .to.emit(documentManager, "PositionRoleUpdated")
          .withArgs(
            OFFICER_ADDRESS,
            DIVISION_ID,
            ADMIN_POSITION_INDEX,
            FIRST_POSITION_INDEX,
            NEW_POSITION_ROLE
          );
        const { role } = await documentManager.getOfficerPosition(
          OFFICER_ADDRESS,
          DIVISION_ID,
          FIRST_POSITION_INDEX
        );

        expect(role).to.be.equal(NEW_POSITION_ROLE);
      });
    });

    describe("Revoke position role", () => {
      const NOT_CREATE_OFFICER = "0xA83722f7d0223C5E0459B10776A15156408Be705";
      const NOT_CREATED_DIVISION = "H31";

      beforeEach(async function () {
        const createOfficerTx = await documentManager
          .connect(admin)
          .createOfficer(
            OFFICER_ADDRESS,
            OFFICER_INFO,
            DIVISION_ID,
            ADMIN_POSITION_INDEX,
            OFFICER_POSITION
          );
        await createOfficerTx.wait();
      });

      it("Should fail to revoke position role if officer not created yet", async () => {
        await expect(
          documentManager
            .connect(admin)
            .revokePositionRole(
              NOT_CREATE_OFFICER,
              DIVISION_ID,
              ADMIN_POSITION_INDEX,
              FIRST_POSITION_INDEX
            )
        ).to.be.revertedWithCustomError(documentManager, "OfficerNotCreated");
      });

      it("Should fail to revoke position role if division not created yet", async () => {
        await expect(
          documentManager
            .connect(admin)
            .revokePositionRole(
              OFFICER_ADDRESS,
              NOT_CREATED_DIVISION,
              ADMIN_POSITION_INDEX,
              FIRST_POSITION_INDEX
            )
        ).to.be.revertedWithCustomError(documentManager, "DivisionNotCreated");
      });

      it("Should fail to revoke position role if position index invalid", async () => {
        await expect(
          documentManager.connect(admin).revokePositionRole(
            OFFICER_ADDRESS,
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
            OFFICER_ADDRESS,
            DIVISION_ID,
            ADMIN_POSITION_INDEX,
            FIRST_POSITION_INDEX
          );

        await updateNameTx.wait();

        await expect(updateNameTx)
          .to.emit(documentManager, "PositionRoleRevoked")
          .withArgs(OFFICER_ADDRESS, DIVISION_ID, ADMIN_POSITION_INDEX, FIRST_POSITION_INDEX);
        const { role } = await documentManager.getOfficerPosition(
          OFFICER_ADDRESS,
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
        .createOfficer(
          divisionAdmin,
          { name: "Nguyen Admin", sex: "Male", dateOfBirth: "01/01/2001" },
          DIVISION_ID,
          ADMIN_POSITION_INDEX,
          { name: "Admin", role: PositionRole.DIVISION_ADMIN }
        );
      await createDivAdminTx.wait();
    });

    describe("Create officer", () => {
      it("Should fail to create officer if creator not created yet", async () => {
        await expect(
          documentManager
            .connect(other)
            .createOfficer(
              OFFICER_ADDRESS,
              OFFICER_INFO,
              DIVISION_ID,
              DIV_ADMIN_POSITION_INDEX,
              OFFICER_POSITION
            )
        ).to.be.revertedWithCustomError(documentManager, "OfficerNotCreated");
      });

      it("Should fail to create officer if division not created yet", async () => {
        const NOT_CREATED_DIVISION = "H30";

        await expect(
          documentManager
            .connect(divisionAdmin)
            .createOfficer(
              OFFICER_ADDRESS,
              OFFICER_INFO,
              NOT_CREATED_DIVISION,
              DIV_ADMIN_POSITION_INDEX,
              OFFICER_POSITION
            )
        ).to.be.revertedWithCustomError(documentManager, "DivisionNotCreated");
      });

      it("Should fail to create officer if creator position index invalid", async () => {
        const INVALID_POSITION_INDEX = 2;
        await expect(
          documentManager
            .connect(divisionAdmin)
            .createOfficer(
              OFFICER_ADDRESS,
              OFFICER_INFO,
              DIVISION_ID,
              INVALID_POSITION_INDEX,
              OFFICER_POSITION
            )
        ).to.be.revertedWithCustomError(documentManager, "PositionIndexOutOfRange");
      });

      it("Should fail to create officer if division admin deactivated", async () => {
        const deactivateTx = await documentManager.connect(admin).deactivateOfficer(divisionAdmin);
        await deactivateTx.wait();

        await expect(
          documentManager
            .connect(divisionAdmin)
            .createOfficer(
              OFFICER_ADDRESS,
              OFFICER_INFO,
              DIVISION_ID,
              DIV_ADMIN_POSITION_INDEX,
              OFFICER_POSITION
            )
        ).to.be.revertedWithCustomError(documentManager, "NotSystemAdminOrDivisionAdmin");
      });

      it("Should fail to create officer if creator not have division admin role", async () => {
        const createOfficerTx = await documentManager
          .connect(admin)
          .createOfficer(
            other,
            { name: "Nguyen Manager", sex: "Male", dateOfBirth: "01/01/2001" },
            DIVISION_ID,
            ADMIN_POSITION_INDEX,
            { name: "Admin", role: PositionRole.MANAGER }
          );
        await createOfficerTx.wait();

        await expect(
          documentManager
            .connect(other)
            .createOfficer(
              OFFICER_ADDRESS,
              OFFICER_INFO,
              DIVISION_ID,
              DIV_ADMIN_POSITION_INDEX,
              OFFICER_POSITION
            )
        ).to.be.revertedWithCustomError(documentManager, "NotSystemAdminOrDivisionAdmin");
      });

      it("Should fail to create officer if assign invalid role", async () => {
        await expect(
          documentManager
            .connect(divisionAdmin)
            .createOfficer(
              OFFICER_ADDRESS,
              OFFICER_INFO,
              DIVISION_ID,
              DIV_ADMIN_POSITION_INDEX,
              {
                name: "President",
                role: PositionRole.REVOKED,
              }
            )
        ).to.be.revertedWithCustomError(documentManager, "InvalidCreatedOfficerRole");
      });

      it("Should succeed to create new officer by division admin", async () => {
        const createTx = await documentManager
          .connect(divisionAdmin)
          .createOfficer(
            OFFICER_ADDRESS,
            OFFICER_INFO,
            DIVISION_ID,
            DIV_ADMIN_POSITION_INDEX,
            OFFICER_POSITION
          );
        await createTx.wait();

        await expect(createTx)
          .to.emit(documentManager, "OfficerCreated")
          .withArgs(
            OFFICER_ADDRESS,
            Result.fromItems(Object.values(OFFICER_INFO)),
            DIVISION_ID,
            DIV_ADMIN_POSITION_INDEX,
            FIRST_POSITION_INDEX,
            Result.fromItems(Object.values(OFFICER_POSITION))
          );

        const { info, status } = await documentManager.getOfficerInfo(OFFICER_ADDRESS);
        expect(info).to.be.deep.equal(toEthersResult(OFFICER_INFO));
        expect(status).to.be.equal(OfficerStatus.ACTIVE);

        const { name, role } = await documentManager.getOfficerPosition(
          OFFICER_ADDRESS,
          DIVISION_ID,
          FIRST_POSITION_INDEX
        );
        expect(name).to.be.equal(OFFICER_POSITION.name);
        expect(role).to.be.equal(OFFICER_POSITION.role);
      });

      it("Should fail to create new officer if officer address already used", async () => {
        const createTx = await documentManager
          .connect(divisionAdmin)
          .createOfficer(
            OFFICER_ADDRESS,
            OFFICER_INFO,
            DIVISION_ID,
            DIV_ADMIN_POSITION_INDEX,
            OFFICER_POSITION
          );
        await createTx.wait();

        await expect(
          documentManager
            .connect(divisionAdmin)
            .createOfficer(
              OFFICER_ADDRESS,
              OFFICER_INFO,
              DIVISION_ID,
              DIV_ADMIN_POSITION_INDEX,
              OFFICER_POSITION
            )
        ).to.be.revertedWithCustomError(documentManager, "OfficerAlreadyCreated");
      });
    });

    describe("Update position name", () => {
      const POSITION_NEW_NAME = "Vice President";

      beforeEach(async function () {
        const createOfficerTx = await documentManager
          .connect(admin)
          .createOfficer(
            OFFICER_ADDRESS,
            OFFICER_INFO,
            DIVISION_ID,
            ADMIN_POSITION_INDEX,
            OFFICER_POSITION
          );
        await createOfficerTx.wait();
      });

      it("Should fail to update officer name if officer not created yet", async () => {
        const NOT_CREATE_OFFICER = "0xA83722f7d0223C5E0459B10776A15156408Be705";

        await expect(
          documentManager
            .connect(divisionAdmin)
            .updatePositionName(
              NOT_CREATE_OFFICER,
              DIVISION_ID,
              DIV_ADMIN_POSITION_INDEX,
              FIRST_POSITION_INDEX,
              POSITION_NEW_NAME
            )
        ).to.be.revertedWithCustomError(documentManager, "OfficerNotCreated");
      });

      it("Should fail to update officer name if division not created yet", async () => {
        const NOT_CREATED_DIVISION = "H31";

        await expect(
          documentManager
            .connect(divisionAdmin)
            .updatePositionName(
              OFFICER_ADDRESS,
              NOT_CREATED_DIVISION,
              DIV_ADMIN_POSITION_INDEX,
              FIRST_POSITION_INDEX,
              POSITION_NEW_NAME
            )
        ).to.be.revertedWithCustomError(documentManager, "DivisionNotCreated");
      });

      it("Should fail to update officer name if position index invalid", async () => {
        await expect(
          documentManager.connect(divisionAdmin).updatePositionName(
            OFFICER_ADDRESS,
            DIVISION_ID,
            DIV_ADMIN_POSITION_INDEX,
            SECOND_POSITION_INDEX, // out of positions array
            POSITION_NEW_NAME
          )
        ).to.be.revertedWithCustomError(documentManager, "PositionIndexOutOfRange");
      });

      it("Should fail to update officer name if creator not created yet", async () => {
        await expect(
          documentManager
            .connect(other)
            .updatePositionName(
              OFFICER_ADDRESS,
              DIVISION_ID,
              DIV_ADMIN_POSITION_INDEX,
              FIRST_POSITION_INDEX,
              POSITION_NEW_NAME
            )
        ).to.be.revertedWithCustomError(documentManager, "OfficerNotCreated");
      });

      it("Should fail to update officer name if creator position index invalid", async () => {
        const INVALID_POSITION_INDEX = 2;
        await expect(
          documentManager
            .connect(divisionAdmin)
            .updatePositionName(
              OFFICER_ADDRESS,
              DIVISION_ID,
              INVALID_POSITION_INDEX,
              FIRST_POSITION_INDEX,
              POSITION_NEW_NAME
            )
        ).to.be.revertedWithCustomError(documentManager, "PositionIndexOutOfRange");
      });

      it("Should fail to update officer name if division admin deactivated", async () => {
        const deactivateTx = await documentManager.connect(admin).deactivateOfficer(divisionAdmin);
        await deactivateTx.wait();

        await expect(
          documentManager
            .connect(divisionAdmin)
            .updatePositionName(
              OFFICER_ADDRESS,
              DIVISION_ID,
              DIV_ADMIN_POSITION_INDEX,
              FIRST_POSITION_INDEX,
              POSITION_NEW_NAME
            )
        ).to.be.revertedWithCustomError(documentManager, "NotSystemAdminOrDivisionAdmin");
      });

      it("Should fail to update officer name  if creator not have division admin role", async () => {
        const createOfficerTx = await documentManager
          .connect(admin)
          .createOfficer(
            other,
            { name: "Nguyen Manager", sex: "Male", dateOfBirth: "01/01/2001" },
            DIVISION_ID,
            ADMIN_POSITION_INDEX,
            { name: "Admin", role: PositionRole.MANAGER }
          );
        await createOfficerTx.wait();

        await expect(
          documentManager
            .connect(other)
            .updatePositionName(
              OFFICER_ADDRESS,
              DIVISION_ID,
              DIV_ADMIN_POSITION_INDEX,
              FIRST_POSITION_INDEX,
              POSITION_NEW_NAME
            )
        ).to.be.revertedWithCustomError(documentManager, "NotSystemAdminOrDivisionAdmin");
      });

      it("Should succeed to update officer name", async () => {
        const updateNameTx = await documentManager
          .connect(divisionAdmin)
          .updatePositionName(
            OFFICER_ADDRESS,
            DIVISION_ID,
            DIV_ADMIN_POSITION_INDEX,
            FIRST_POSITION_INDEX,
            POSITION_NEW_NAME
          );

        await updateNameTx.wait();

        await expect(updateNameTx)
          .to.emit(documentManager, "PositionNameUpdated")
          .withArgs(
            OFFICER_ADDRESS,
            DIVISION_ID,
            ADMIN_POSITION_INDEX,
            FIRST_POSITION_INDEX,
            POSITION_NEW_NAME
          );
        const { name } = await documentManager.getOfficerPosition(
          OFFICER_ADDRESS,
          DIVISION_ID,
          FIRST_POSITION_INDEX
        );

        expect(name).to.be.equal(POSITION_NEW_NAME);
      });
    });

    describe("Update position role", () => {
      const POSITION_NEW_ROLE = PositionRole.MANAGER;

      beforeEach(async function () {
        const createOfficerTx = await documentManager
          .connect(admin)
          .createOfficer(
            OFFICER_ADDRESS,
            OFFICER_INFO,
            DIVISION_ID,
            ADMIN_POSITION_INDEX,
            OFFICER_POSITION
          );
        await createOfficerTx.wait();
      });

      it("Should fail to update officer role if officer not created yet", async () => {
        const NOT_CREATE_OFFICER = "0xA83722f7d0223C5E0459B10776A15156408Be705";

        await expect(
          documentManager
            .connect(divisionAdmin)
            .updatePositionRole(
              NOT_CREATE_OFFICER,
              DIVISION_ID,
              DIV_ADMIN_POSITION_INDEX,
              FIRST_POSITION_INDEX,
              POSITION_NEW_ROLE
            )
        ).to.be.revertedWithCustomError(documentManager, "OfficerNotCreated");
      });

      it("Should fail to update officer role if division not created yet", async () => {
        const NOT_CREATED_DIVISION = "H31";

        await expect(
          documentManager
            .connect(divisionAdmin)
            .updatePositionRole(
              OFFICER_ADDRESS,
              NOT_CREATED_DIVISION,
              DIV_ADMIN_POSITION_INDEX,
              FIRST_POSITION_INDEX,
              POSITION_NEW_ROLE
            )
        ).to.be.revertedWithCustomError(documentManager, "DivisionNotCreated");
      });

      it("Should fail to update officer role if position index invalid", async () => {
        await expect(
          documentManager.connect(divisionAdmin).updatePositionRole(
            OFFICER_ADDRESS,
            DIVISION_ID,
            DIV_ADMIN_POSITION_INDEX,
            SECOND_POSITION_INDEX, // out of positions array
            POSITION_NEW_ROLE
          )
        ).to.be.revertedWithCustomError(documentManager, "PositionIndexOutOfRange");
      });

      it("Should fail to update officer role if creator not created yet", async () => {
        await expect(
          documentManager
            .connect(other)
            .updatePositionRole(
              OFFICER_ADDRESS,
              DIVISION_ID,
              DIV_ADMIN_POSITION_INDEX,
              FIRST_POSITION_INDEX,
              POSITION_NEW_ROLE
            )
        ).to.be.revertedWithCustomError(documentManager, "OfficerNotCreated");
      });

      it("Should fail to update officer role if creator position index invalid", async () => {
        const INVALID_POSITION_INDEX = 2;
        await expect(
          documentManager
            .connect(divisionAdmin)
            .updatePositionRole(
              OFFICER_ADDRESS,
              DIVISION_ID,
              INVALID_POSITION_INDEX,
              FIRST_POSITION_INDEX,
              POSITION_NEW_ROLE
            )
        ).to.be.revertedWithCustomError(documentManager, "PositionIndexOutOfRange");
      });

      it("Should fail to update officer role if division admin deactivated", async () => {
        const deactivateTx = await documentManager.connect(admin).deactivateOfficer(divisionAdmin);
        await deactivateTx.wait();

        await expect(
          documentManager
            .connect(divisionAdmin)
            .updatePositionRole(
              OFFICER_ADDRESS,
              DIVISION_ID,
              DIV_ADMIN_POSITION_INDEX,
              FIRST_POSITION_INDEX,
              POSITION_NEW_ROLE
            )
        ).to.be.revertedWithCustomError(documentManager, "NotSystemAdminOrDivisionAdmin");
      });

      it("Should fail to update officer role if creator not have division admin role", async () => {
        const createOfficerTx = await documentManager
          .connect(admin)
          .createOfficer(
            other,
            { name: "Nguyen Manager", sex: "Male", dateOfBirth: "01/01/2001" },
            DIVISION_ID,
            ADMIN_POSITION_INDEX,
            { name: "Admin", role: PositionRole.MANAGER }
          );
        await createOfficerTx.wait();

        await expect(
          documentManager
            .connect(other)
            .updatePositionRole(
              OFFICER_ADDRESS,
              DIVISION_ID,
              DIV_ADMIN_POSITION_INDEX,
              FIRST_POSITION_INDEX,
              POSITION_NEW_ROLE
            )
        ).to.be.revertedWithCustomError(documentManager, "NotSystemAdminOrDivisionAdmin");
      });

      it("Should fail to update officer role if new role invalid", async () => {
        await expect(
          documentManager
            .connect(divisionAdmin)
            .updatePositionRole(
              OFFICER_ADDRESS,
              DIVISION_ID,
              DIV_ADMIN_POSITION_INDEX,
              FIRST_POSITION_INDEX,
              PositionRole.REVOKED
            )
        ).to.be.revertedWithCustomError(documentManager, "InvalidUpdatedRole");
      });

      it("Should succeed to update officer role", async () => {
        const updateNameTx = await documentManager
          .connect(divisionAdmin)
          .updatePositionRole(
            OFFICER_ADDRESS,
            DIVISION_ID,
            DIV_ADMIN_POSITION_INDEX,
            FIRST_POSITION_INDEX,
            POSITION_NEW_ROLE
          );

        await updateNameTx.wait();

        await expect(updateNameTx)
          .to.emit(documentManager, "PositionRoleUpdated")
          .withArgs(
            OFFICER_ADDRESS,
            DIVISION_ID,
            ADMIN_POSITION_INDEX,
            FIRST_POSITION_INDEX,
            POSITION_NEW_ROLE
          );

        const { role } = await documentManager.getOfficerPosition(
          OFFICER_ADDRESS,
          DIVISION_ID,
          FIRST_POSITION_INDEX
        );

        expect(role).to.be.equal(POSITION_NEW_ROLE);
      });
    });

    describe("Revoke position role", () => {
      beforeEach(async function () {
        const createOfficerTx = await documentManager
          .connect(admin)
          .createOfficer(
            OFFICER_ADDRESS,
            OFFICER_INFO,
            DIVISION_ID,
            ADMIN_POSITION_INDEX,
            OFFICER_POSITION
          );
        await createOfficerTx.wait();
      });

      it("Should fail to revoke position role if officer not created yet", async () => {
        const NOT_CREATE_OFFICER = "0xA83722f7d0223C5E0459B10776A15156408Be705";

        await expect(
          documentManager
            .connect(divisionAdmin)
            .revokePositionRole(
              NOT_CREATE_OFFICER,
              DIVISION_ID,
              DIV_ADMIN_POSITION_INDEX,
              FIRST_POSITION_INDEX
            )
        ).to.be.revertedWithCustomError(documentManager, "OfficerNotCreated");
      });

      it("Should fail to revoke position role if division not created yet", async () => {
        const NOT_CREATED_DIVISION = "H31";

        await expect(
          documentManager
            .connect(divisionAdmin)
            .revokePositionRole(
              OFFICER_ADDRESS,
              NOT_CREATED_DIVISION,
              DIV_ADMIN_POSITION_INDEX,
              FIRST_POSITION_INDEX
            )
        ).to.be.revertedWithCustomError(documentManager, "DivisionNotCreated");
      });

      it("Should fail to revoke position role if position index invalid", async () => {
        await expect(
          documentManager.connect(divisionAdmin).revokePositionRole(
            OFFICER_ADDRESS,
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
              OFFICER_ADDRESS,
              DIVISION_ID,
              DIV_ADMIN_POSITION_INDEX,
              FIRST_POSITION_INDEX
            )
        ).to.be.revertedWithCustomError(documentManager, "OfficerNotCreated");
      });

      it("Should fail to revoke position role if creator position index invalid", async () => {
        const INVALID_POSITION_INDEX = 2;
        await expect(
          documentManager
            .connect(divisionAdmin)
            .revokePositionRole(
              OFFICER_ADDRESS,
              DIVISION_ID,
              INVALID_POSITION_INDEX,
              FIRST_POSITION_INDEX
            )
        ).to.be.revertedWithCustomError(documentManager, "PositionIndexOutOfRange");
      });

      it("Should fail to revoke position role if division admin deactivated", async () => {
        const deactivateTx = await documentManager.connect(admin).deactivateOfficer(divisionAdmin);
        await deactivateTx.wait();

        await expect(
          documentManager
            .connect(divisionAdmin)
            .revokePositionRole(
              OFFICER_ADDRESS,
              DIVISION_ID,
              DIV_ADMIN_POSITION_INDEX,
              FIRST_POSITION_INDEX
            )
        ).to.be.revertedWithCustomError(documentManager, "NotSystemAdminOrDivisionAdmin");
      });

      it("Should fail to revoke position role if creator not have division admin role", async () => {
        const createOfficerTx = await documentManager
          .connect(admin)
          .createOfficer(
            other,
            { name: "Nguyen Manager", sex: "Male", dateOfBirth: "01/01/2001" },
            DIVISION_ID,
            ADMIN_POSITION_INDEX,
            { name: "Admin", role: PositionRole.MANAGER }
          );
        await createOfficerTx.wait();

        await expect(
          documentManager
            .connect(other)
            .revokePositionRole(
              OFFICER_ADDRESS,
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
            OFFICER_ADDRESS,
            DIVISION_ID,
            DIV_ADMIN_POSITION_INDEX,
            FIRST_POSITION_INDEX
          );

        await updateNameTx.wait();

        await expect(updateNameTx)
          .to.emit(documentManager, "PositionRoleRevoked")
          .withArgs(OFFICER_ADDRESS, DIVISION_ID, ADMIN_POSITION_INDEX, FIRST_POSITION_INDEX);

        const { role } = await documentManager.getOfficerPosition(
          OFFICER_ADDRESS,
          DIVISION_ID,
          FIRST_POSITION_INDEX
        );

        expect(role).to.be.equal(PositionRole.REVOKED);
      });
    });
  });
});
