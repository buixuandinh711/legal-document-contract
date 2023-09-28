import { ethers } from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { LegalDocumentManager, LegalDocumentManager__factory } from "../typechain-types";
import { PositionRole } from "../utils/contract.type";
import {
  ADMIN_POSITION_INDEX,
  MAX_POSITION_INDEX,
  ROOT_DIVISION_ID,
  toEthersResult,
} from "../utils/utils";

describe("PositionManager", () => {
  const DIVISION_ID = "H26";
  const OFFICER_ADDRESS = "0x14BbEb5702533e67D9b309927807954E568041E5";
  const POSITION_INFO = {
    name: "President",
    role: PositionRole.MANAGER,
  };
  const [FIRST_POSITION_INDEX, SECOND_POSITION_INDEX] = Array.from(
    { length: 10 },
    (_, index) => index
  );
  const NOT_CREATE_OFFICER = "0xA83722f7d0223C5E0459B10776A15156408Be705";
  const NOT_CREATED_DIVISION_ID = "K12";

  let admin: SignerWithAddress;
  let documentManager: LegalDocumentManager;

  beforeEach(async function () {
    [admin] = await ethers.getSigners();

    documentManager = await new LegalDocumentManager__factory(admin).deploy();
    await documentManager.waitForDeployment();

    const createDivTx = await documentManager
      .connect(admin)
      .createDivision(DIVISION_ID, "Hanoi Commitee", ROOT_DIVISION_ID);
    await createDivTx.wait();

    const createOfficerTx = await documentManager.connect(admin).createOfficer(OFFICER_ADDRESS, {
      name: "Nguyen Van A",
      sex: "Male",
      dateOfBirth: "01/01/2001",
    });
    await createOfficerTx.wait();
  });

  describe("Called by the system admin", () => {
    beforeEach(async () => {
      documentManager = documentManager.connect(admin);
    });

    describe("Create position", () => {
      it("Should fail if officer not active", async () => {
        const deactivateTx = await documentManager.deactivateOfficer(OFFICER_ADDRESS);
        await deactivateTx.wait();

        await expect(
          documentManager.createPosition(
            OFFICER_ADDRESS,
            DIVISION_ID,
            POSITION_INFO,
            ADMIN_POSITION_INDEX
          )
        ).to.be.revertedWithCustomError(documentManager, "OfficerNotActive");
      });

      it("Should fail if division not active", async () => {
        const deactivateTx = await documentManager.deactivateDivision(DIVISION_ID);
        await deactivateTx.wait();
        await expect(
          documentManager.createPosition(
            OFFICER_ADDRESS,
            DIVISION_ID,
            POSITION_INFO,
            ADMIN_POSITION_INDEX
          )
        ).to.be.revertedWithCustomError(documentManager, "DivisionNotActive");
      });

      it("Should fail if create with invalid role", async () => {
        await expect(
          documentManager.createPosition(
            OFFICER_ADDRESS,
            DIVISION_ID,
            { ...POSITION_INFO, role: PositionRole.REVOKED },
            ADMIN_POSITION_INDEX
          )
        ).to.be.revertedWithCustomError(documentManager, "InvalidCreatedPositionRole");
      });

      it("Should succeed to create position", async () => {
        const tx = await documentManager.createPosition(
          OFFICER_ADDRESS,
          DIVISION_ID,
          POSITION_INFO,
          ADMIN_POSITION_INDEX
        );
        await tx.wait();

        await expect(tx)
          .to.emit(documentManager, "PositionCreated")
          .withArgs(
            OFFICER_ADDRESS,
            DIVISION_ID,
            toEthersResult(POSITION_INFO),
            FIRST_POSITION_INDEX,
            ADMIN_POSITION_INDEX
          );

        const positionInfo = await documentManager.getPosition(
          OFFICER_ADDRESS,
          DIVISION_ID,
          FIRST_POSITION_INDEX
        );

        expect(positionInfo).to.be.deep.equal(toEthersResult(POSITION_INFO));
      });
    });

    describe("Revoke position", () => {
      beforeEach(async () => {
        const tx = await documentManager.createPosition(
          OFFICER_ADDRESS,
          DIVISION_ID,
          POSITION_INFO,
          ADMIN_POSITION_INDEX
        );
        await tx.wait();
      });

      it("Should fail if officer not created", async () => {
        await expect(
          documentManager.revokePosition(
            NOT_CREATE_OFFICER,
            DIVISION_ID,
            FIRST_POSITION_INDEX,
            ADMIN_POSITION_INDEX
          )
        ).to.be.revertedWithCustomError(documentManager, "OfficerNotCreated");
      });

      it("Should fail if division not created", async () => {
        await expect(
          documentManager.revokePosition(
            OFFICER_ADDRESS,
            NOT_CREATED_DIVISION_ID,
            FIRST_POSITION_INDEX,
            ADMIN_POSITION_INDEX
          )
        ).to.be.revertedWithCustomError(documentManager, "DivisionNotCreated");
      });

      it("Should fail if position index out of range", async () => {
        await expect(
          documentManager.revokePosition(
            OFFICER_ADDRESS,
            DIVISION_ID,
            MAX_POSITION_INDEX + 1,
            ADMIN_POSITION_INDEX
          )
        ).to.be.revertedWithCustomError(documentManager, "PositionIndexOutOfRange");
      });

      it("Should fail if position index not assigned", async () => {
        await expect(
          documentManager.revokePosition(
            OFFICER_ADDRESS,
            DIVISION_ID,
            SECOND_POSITION_INDEX, // not created position
            ADMIN_POSITION_INDEX
          )
        ).to.be.revertedWithCustomError(documentManager, "PositionIndexNotAssigned");
      });

      it("Should succeed to revoke position", async () => {
        const tx = await documentManager.revokePosition(
          OFFICER_ADDRESS,
          DIVISION_ID,
          FIRST_POSITION_INDEX,
          ADMIN_POSITION_INDEX
        );
        await tx.wait();

        await expect(tx)
          .to.emit(documentManager, "PositionRevoked")
          .withArgs(OFFICER_ADDRESS, DIVISION_ID, FIRST_POSITION_INDEX, ADMIN_POSITION_INDEX);

        const { role } = await documentManager.getPosition(
          OFFICER_ADDRESS,
          DIVISION_ID,
          FIRST_POSITION_INDEX
        );

        expect(role).to.be.equal(PositionRole.REVOKED);
      });
    });

    describe("Update position name", () => {
      const NEW_POSITION_NAME = "Vice President";

      beforeEach(async () => {
        const tx = await documentManager.createPosition(
          OFFICER_ADDRESS,
          DIVISION_ID,
          POSITION_INFO,
          ADMIN_POSITION_INDEX
        );
        await tx.wait();
      });

      it("Should fail if officer not created", async () => {
        await expect(
          documentManager.updatePositionName(
            NOT_CREATE_OFFICER,
            DIVISION_ID,
            FIRST_POSITION_INDEX,
            NEW_POSITION_NAME,
            ADMIN_POSITION_INDEX
          )
        ).to.be.revertedWithCustomError(documentManager, "OfficerNotCreated");
      });

      it("Should fail if division not created", async () => {
        await expect(
          documentManager.updatePositionName(
            OFFICER_ADDRESS,
            NOT_CREATED_DIVISION_ID,
            FIRST_POSITION_INDEX,
            NEW_POSITION_NAME,
            ADMIN_POSITION_INDEX
          )
        ).to.be.revertedWithCustomError(documentManager, "DivisionNotCreated");
      });

      it("Should fail if position index out of range", async () => {
        await expect(
          documentManager.updatePositionName(
            OFFICER_ADDRESS,
            DIVISION_ID,
            MAX_POSITION_INDEX + 1,
            NEW_POSITION_NAME,
            ADMIN_POSITION_INDEX
          )
        ).to.be.revertedWithCustomError(documentManager, "PositionIndexOutOfRange");
      });

      it("Should fail if position index not assigned", async () => {
        await expect(
          documentManager.updatePositionName(
            OFFICER_ADDRESS,
            DIVISION_ID,
            SECOND_POSITION_INDEX, // not created position
            NEW_POSITION_NAME,
            ADMIN_POSITION_INDEX
          )
        ).to.be.revertedWithCustomError(documentManager, "PositionIndexNotAssigned");
      });

      it("Should succeed to update position name", async () => {
        const tx = await documentManager.updatePositionName(
          OFFICER_ADDRESS,
          DIVISION_ID,
          FIRST_POSITION_INDEX,
          NEW_POSITION_NAME,
          ADMIN_POSITION_INDEX
        );
        await tx.wait();

        await expect(tx)
          .to.emit(documentManager, "PositionNameUpdated")
          .withArgs(
            OFFICER_ADDRESS,
            DIVISION_ID,
            FIRST_POSITION_INDEX,
            NEW_POSITION_NAME,
            ADMIN_POSITION_INDEX
          );

        const { name } = await documentManager.getPosition(
          OFFICER_ADDRESS,
          DIVISION_ID,
          FIRST_POSITION_INDEX
        );

        expect(name).to.be.equal(NEW_POSITION_NAME);
      });
    });

    describe("Update position role", () => {
      const NEW_POSITION_ROLE = PositionRole.STAFF;

      beforeEach(async () => {
        const tx = await documentManager.createPosition(
          OFFICER_ADDRESS,
          DIVISION_ID,
          POSITION_INFO,
          ADMIN_POSITION_INDEX
        );
        await tx.wait();
      });

      it("Should fail if officer not created", async () => {
        await expect(
          documentManager.updatePositionRole(
            NOT_CREATE_OFFICER,
            DIVISION_ID,
            FIRST_POSITION_INDEX,
            NEW_POSITION_ROLE,
            ADMIN_POSITION_INDEX
          )
        ).to.be.revertedWithCustomError(documentManager, "OfficerNotCreated");
      });

      it("Should fail if division not created", async () => {
        await expect(
          documentManager.updatePositionRole(
            OFFICER_ADDRESS,
            NOT_CREATED_DIVISION_ID,
            FIRST_POSITION_INDEX,
            NEW_POSITION_ROLE,
            ADMIN_POSITION_INDEX
          )
        ).to.be.revertedWithCustomError(documentManager, "DivisionNotCreated");
      });

      it("Should fail if position index out of range", async () => {
        await expect(
          documentManager.updatePositionRole(
            OFFICER_ADDRESS,
            DIVISION_ID,
            MAX_POSITION_INDEX + 1,
            NEW_POSITION_ROLE,
            ADMIN_POSITION_INDEX
          )
        ).to.be.revertedWithCustomError(documentManager, "PositionIndexOutOfRange");
      });

      it("Should fail if position index not assigned", async () => {
        await expect(
          documentManager.updatePositionRole(
            OFFICER_ADDRESS,
            DIVISION_ID,
            SECOND_POSITION_INDEX, // not created position
            NEW_POSITION_ROLE,
            ADMIN_POSITION_INDEX
          )
        ).to.be.revertedWithCustomError(documentManager, "PositionIndexNotAssigned");
      });

      it("Should succeed to update position name", async () => {
        const tx = await documentManager.updatePositionRole(
          OFFICER_ADDRESS,
          DIVISION_ID,
          FIRST_POSITION_INDEX,
          NEW_POSITION_ROLE,
          ADMIN_POSITION_INDEX
        );
        await tx.wait();

        await expect(tx)
          .to.emit(documentManager, "PositionRoleUpdated")
          .withArgs(
            OFFICER_ADDRESS,
            DIVISION_ID,
            FIRST_POSITION_INDEX,
            NEW_POSITION_ROLE,
            ADMIN_POSITION_INDEX
          );

        const { role } = await documentManager.getPosition(
          OFFICER_ADDRESS,
          DIVISION_ID,
          FIRST_POSITION_INDEX
        );

        expect(role).to.be.equal(NEW_POSITION_ROLE);
      });
    });
  });

  describe("Called by the division admin", () => {
    let divisionAdmin: SignerWithAddress;

    beforeEach(async () => {
      [, , divisionAdmin] = await ethers.getSigners();

      const createAdminTx = await documentManager.connect(admin).createOfficer(divisionAdmin, {
        name: "Tran Van B",
        sex: "Male",
        dateOfBirth: "2000",
      });
      await createAdminTx.wait();

      const createAdminPositionTx = await documentManager.createPosition(
        divisionAdmin,
        DIVISION_ID,
        { name: "Admin", role: PositionRole.DIVISION_ADMIN },
        ADMIN_POSITION_INDEX
      );
      await createAdminPositionTx.wait();
    });

    describe("Create position", () => {
      it("Should fail if division admin not active", async () => {
        const deactivateTx = await documentManager.connect(admin).deactivateOfficer(divisionAdmin);
        await deactivateTx.wait();

        await expect(
          documentManager
            .connect(divisionAdmin)
            .createPosition(OFFICER_ADDRESS, DIVISION_ID, POSITION_INFO, FIRST_POSITION_INDEX)
        ).to.be.revertedWithCustomError(documentManager, "OfficerNotActive");
      });

      it("Should fail if division not active", async () => {
        const deactivateTx = await documentManager.deactivateDivision(DIVISION_ID);
        await deactivateTx.wait();

        await expect(
          documentManager
            .connect(divisionAdmin)
            .createPosition(OFFICER_ADDRESS, DIVISION_ID, POSITION_INFO, FIRST_POSITION_INDEX)
        ).to.be.revertedWithCustomError(documentManager, "DivisionNotActive");
      });

      it("Should fail if division admin position index out of range", async () => {
        await expect(
          documentManager
            .connect(divisionAdmin)
            .createPosition(OFFICER_ADDRESS, DIVISION_ID, POSITION_INFO, MAX_POSITION_INDEX + 999)
        ).to.be.revertedWithCustomError(documentManager, "PositionIndexOutOfRange");
      });

      it("Should fail if division admin position index not assigned", async () => {
        await expect(
          documentManager
            .connect(divisionAdmin)
            .createPosition(OFFICER_ADDRESS, DIVISION_ID, POSITION_INFO, SECOND_POSITION_INDEX)
        ).to.be.revertedWithCustomError(documentManager, "PositionIndexNotAssigned");
      });

      it("Should succeed to create position", async () => {
        const tx = await documentManager
          .connect(divisionAdmin)
          .createPosition(OFFICER_ADDRESS, DIVISION_ID, POSITION_INFO, FIRST_POSITION_INDEX);
        await tx.wait();

        await expect(tx)
          .to.emit(documentManager, "PositionCreated")
          .withArgs(
            OFFICER_ADDRESS,
            DIVISION_ID,
            toEthersResult(POSITION_INFO),
            FIRST_POSITION_INDEX,
            FIRST_POSITION_INDEX
          );

        const positionInfo = await documentManager.getPosition(
          OFFICER_ADDRESS,
          DIVISION_ID,
          FIRST_POSITION_INDEX
        );

        expect(positionInfo).to.be.deep.equal(toEthersResult(POSITION_INFO));
      });
    });

    describe("Revoke position", () => {
      beforeEach(async () => {
        const createOfficerPositionTx = await documentManager.createPosition(
          OFFICER_ADDRESS,
          DIVISION_ID,
          POSITION_INFO,
          ADMIN_POSITION_INDEX
        );
        await createOfficerPositionTx.wait();
      });

      it("Should fail if division admin not active", async () => {
        const deactivateTx = await documentManager.connect(admin).deactivateOfficer(divisionAdmin);
        await deactivateTx.wait();

        await expect(
          documentManager
            .connect(divisionAdmin)
            .revokePosition(
              OFFICER_ADDRESS,
              DIVISION_ID,
              FIRST_POSITION_INDEX,
              FIRST_POSITION_INDEX
            )
        ).to.be.revertedWithCustomError(documentManager, "OfficerNotActive");
      });

      it("Should fail if division not active", async () => {
        const deactivateTx = await documentManager.deactivateDivision(DIVISION_ID);
        await deactivateTx.wait();

        await expect(
          documentManager
            .connect(divisionAdmin)
            .revokePosition(
              OFFICER_ADDRESS,
              DIVISION_ID,
              FIRST_POSITION_INDEX,
              FIRST_POSITION_INDEX
            )
        ).to.be.revertedWithCustomError(documentManager, "DivisionNotActive");
      });

      it("Should fail if division admin position index out of range", async () => {
        await expect(
          documentManager
            .connect(divisionAdmin)
            .revokePosition(
              OFFICER_ADDRESS,
              DIVISION_ID,
              FIRST_POSITION_INDEX,
              MAX_POSITION_INDEX + 999
            )
        ).to.be.revertedWithCustomError(documentManager, "PositionIndexOutOfRange");
      });

      it("Should fail if division admin position index not assigned", async () => {
        await expect(
          documentManager
            .connect(divisionAdmin)
            .revokePosition(
              OFFICER_ADDRESS,
              DIVISION_ID,
              FIRST_POSITION_INDEX,
              SECOND_POSITION_INDEX
            )
        ).to.be.revertedWithCustomError(documentManager, "PositionIndexNotAssigned");
      });

      it("Should succeed to revoke position", async () => {
        const tx = await documentManager
          .connect(divisionAdmin)
          .revokePosition(OFFICER_ADDRESS, DIVISION_ID, FIRST_POSITION_INDEX, FIRST_POSITION_INDEX);
        await tx.wait();

        await expect(tx)
          .to.emit(documentManager, "PositionRevoked")
          .withArgs(OFFICER_ADDRESS, DIVISION_ID, FIRST_POSITION_INDEX, FIRST_POSITION_INDEX);

        const { role } = await documentManager.getPosition(
          OFFICER_ADDRESS,
          DIVISION_ID,
          FIRST_POSITION_INDEX
        );

        expect(role).to.be.deep.equal(PositionRole.REVOKED);
      });
    });

    describe("Update position name", () => {
      const NEW_POSITION_NAME = "Minister";

      beforeEach(async () => {
        const createOfficerPositionTx = await documentManager.createPosition(
          OFFICER_ADDRESS,
          DIVISION_ID,
          POSITION_INFO,
          ADMIN_POSITION_INDEX
        );
        await createOfficerPositionTx.wait();
      });

      it("Should fail if division admin not active", async () => {
        const deactivateTx = await documentManager.connect(admin).deactivateOfficer(divisionAdmin);
        await deactivateTx.wait();

        await expect(
          documentManager
            .connect(divisionAdmin)
            .updatePositionName(
              OFFICER_ADDRESS,
              DIVISION_ID,
              FIRST_POSITION_INDEX,
              NEW_POSITION_NAME,
              FIRST_POSITION_INDEX
            )
        ).to.be.revertedWithCustomError(documentManager, "OfficerNotActive");
      });

      it("Should fail if division not active", async () => {
        const deactivateTx = await documentManager.deactivateDivision(DIVISION_ID);
        await deactivateTx.wait();

        await expect(
          documentManager
            .connect(divisionAdmin)
            .updatePositionName(
              OFFICER_ADDRESS,
              DIVISION_ID,
              FIRST_POSITION_INDEX,
              NEW_POSITION_NAME,
              FIRST_POSITION_INDEX
            )
        ).to.be.revertedWithCustomError(documentManager, "DivisionNotActive");
      });

      it("Should fail if division admin position index out of range", async () => {
        await expect(
          documentManager
            .connect(divisionAdmin)
            .updatePositionName(
              OFFICER_ADDRESS,
              DIVISION_ID,
              FIRST_POSITION_INDEX,
              NEW_POSITION_NAME,
              MAX_POSITION_INDEX + 999
            )
        ).to.be.revertedWithCustomError(documentManager, "PositionIndexOutOfRange");
      });

      it("Should fail if division admin position index not assigned", async () => {
        await expect(
          documentManager
            .connect(divisionAdmin)
            .updatePositionName(
              OFFICER_ADDRESS,
              DIVISION_ID,
              FIRST_POSITION_INDEX,
              NEW_POSITION_NAME,
              SECOND_POSITION_INDEX
            )
        ).to.be.revertedWithCustomError(documentManager, "PositionIndexNotAssigned");
      });

      it("Should succeed to update position name", async () => {
        const tx = await documentManager
          .connect(divisionAdmin)
          .updatePositionName(
            OFFICER_ADDRESS,
            DIVISION_ID,
            FIRST_POSITION_INDEX,
            NEW_POSITION_NAME,
            FIRST_POSITION_INDEX
          );
        await tx.wait();

        await expect(tx)
          .to.emit(documentManager, "PositionNameUpdated")
          .withArgs(
            OFFICER_ADDRESS,
            DIVISION_ID,
            FIRST_POSITION_INDEX,
            NEW_POSITION_NAME,
            FIRST_POSITION_INDEX
          );

        const { name } = await documentManager.getPosition(
          OFFICER_ADDRESS,
          DIVISION_ID,
          FIRST_POSITION_INDEX
        );

        expect(name).to.be.deep.equal(NEW_POSITION_NAME);
      });
    });

    describe("Update position role", () => {
      const NEW_POSITION_ROLE = PositionRole.STAFF;

      beforeEach(async () => {
        const createOfficerPositionTx = await documentManager.createPosition(
          OFFICER_ADDRESS,
          DIVISION_ID,
          POSITION_INFO,
          ADMIN_POSITION_INDEX
        );
        await createOfficerPositionTx.wait();
      });

      it("Should fail if division admin not active", async () => {
        const deactivateTx = await documentManager.connect(admin).deactivateOfficer(divisionAdmin);
        await deactivateTx.wait();

        await expect(
          documentManager
            .connect(divisionAdmin)
            .updatePositionRole(
              OFFICER_ADDRESS,
              DIVISION_ID,
              FIRST_POSITION_INDEX,
              NEW_POSITION_ROLE,
              FIRST_POSITION_INDEX
            )
        ).to.be.revertedWithCustomError(documentManager, "OfficerNotActive");
      });

      it("Should fail if division not active", async () => {
        const deactivateTx = await documentManager.deactivateDivision(DIVISION_ID);
        await deactivateTx.wait();

        await expect(
          documentManager
            .connect(divisionAdmin)
            .updatePositionRole(
              OFFICER_ADDRESS,
              DIVISION_ID,
              FIRST_POSITION_INDEX,
              NEW_POSITION_ROLE,
              FIRST_POSITION_INDEX
            )
        ).to.be.revertedWithCustomError(documentManager, "DivisionNotActive");
      });

      it("Should fail if division admin position index out of range", async () => {
        await expect(
          documentManager
            .connect(divisionAdmin)
            .updatePositionRole(
              OFFICER_ADDRESS,
              DIVISION_ID,
              FIRST_POSITION_INDEX,
              NEW_POSITION_ROLE,
              MAX_POSITION_INDEX + 999
            )
        ).to.be.revertedWithCustomError(documentManager, "PositionIndexOutOfRange");
      });

      it("Should fail if division admin position index not assigned", async () => {
        await expect(
          documentManager
            .connect(divisionAdmin)
            .updatePositionRole(
              OFFICER_ADDRESS,
              DIVISION_ID,
              FIRST_POSITION_INDEX,
              NEW_POSITION_ROLE,
              SECOND_POSITION_INDEX
            )
        ).to.be.revertedWithCustomError(documentManager, "PositionIndexNotAssigned");
      });

      it("Should succeed to update position role", async () => {
        const tx = await documentManager
          .connect(divisionAdmin)
          .updatePositionRole(
            OFFICER_ADDRESS,
            DIVISION_ID,
            FIRST_POSITION_INDEX,
            NEW_POSITION_ROLE,
            FIRST_POSITION_INDEX
          );
        await tx.wait();

        await expect(tx)
          .to.emit(documentManager, "PositionRoleUpdated")
          .withArgs(
            OFFICER_ADDRESS,
            DIVISION_ID,
            FIRST_POSITION_INDEX,
            NEW_POSITION_ROLE,
            FIRST_POSITION_INDEX
          );

        const { role } = await documentManager.getPosition(
          OFFICER_ADDRESS,
          DIVISION_ID,
          FIRST_POSITION_INDEX
        );

        expect(role).to.be.deep.equal(NEW_POSITION_ROLE);
      });
    });
  });
});
