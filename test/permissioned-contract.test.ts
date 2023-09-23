import { ethers } from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import {
  AccountIngress,
  AccountIngress__factory,
  LegalDocumentManager,
  LegalDocumentManager__factory,
} from "../typechain-types";
import { ONE_GWEI, ONE_WEI } from "../utils/utils";
import { PositionRole } from "../utils/contract.type";

describe("AccountIngress", () => {
  const GAS_LIMIT = 1e5;

  let admin: SignerWithAddress;
  let other: SignerWithAddress;
  let documentManager: LegalDocumentManager;
  let accountIngress: AccountIngress;

  beforeEach(async function () {
    [admin, other] = await ethers.getSigners();

    documentManager = await new LegalDocumentManager__factory(admin).deploy();
    await documentManager.waitForDeployment();

    accountIngress = await new AccountIngress__factory(admin).deploy(documentManager);
    await accountIngress.waitForDeployment();
  });

  describe("Transaction allowance", () => {
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

    beforeEach(async () => {
      const createDivTx = await documentManager
        .connect(admin)
        .createDivision(DIVISION_ID, DIVISION_NAME, SUPERVISORY_DIV_ID);
      await createDivTx.wait();

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

    it("Should allow if called by system admin", async () => {
      const allowance = await accountIngress.transactionAllowed.staticCall(
        admin,
        other,
        ONE_WEI,
        ONE_GWEI,
        GAS_LIMIT,
        "0x"
      );

      expect(allowance).to.be.true;
    });

    it("Should allow if transaction from active officer to document manager", async () => {
      const allowance = await accountIngress.transactionAllowed.staticCall(
        OFFICER_ADDRESS,
        documentManager,
        ONE_WEI,
        ONE_GWEI,
        GAS_LIMIT,
        "0x"
      );

      expect(allowance).to.be.true;
    });

    it("Should reject if transaction from deactivated officer", async () => {
      const deactivateTx = await documentManager
        .connect(admin)
        .deactivateOfficer(OFFICER_ADDRESS);
      await deactivateTx.wait();

      const allowance = await accountIngress.transactionAllowed.staticCall(
        OFFICER_ADDRESS,
        documentManager,
        ONE_WEI,
        ONE_GWEI,
        GAS_LIMIT,
        "0x"
      );

      expect(allowance).to.be.false;
    });

    it("Should reject if transaction not to document manager", async () => {
      const allowance = await accountIngress.transactionAllowed.staticCall(
        OFFICER_ADDRESS,
        other,
        ONE_WEI,
        ONE_GWEI,
        GAS_LIMIT,
        "0x"
      );

      expect(allowance).to.be.false;
    });
  });

  describe("Update document manager", () => {
    let newAdmin: SignerWithAddress;
    let newDocumentManager: LegalDocumentManager;

    beforeEach(async () => {
      newAdmin = (await ethers.getSigners())[4];

      newDocumentManager = await new LegalDocumentManager__factory(newAdmin).deploy();
      await newDocumentManager.waitForDeployment();
    });

    it("Should fail if not called by admin", async () => {
      await expect(
        accountIngress.connect(other).updateDocumentManager(newDocumentManager)
      ).to.be.revertedWithCustomError(accountIngress, "NotSystemAdmin");
    });

    it("Should succeed to update document manager", async () => {
      const updateTx = await accountIngress.updateDocumentManager(newDocumentManager);
      await updateTx.wait();

      await expect(updateTx)
        .to.emit(accountIngress, "DocumentManagerUpdated")
        .withArgs(await newDocumentManager.getAddress());

      const updateDocumentManager = await accountIngress.getDocumentManager();
      expect(updateDocumentManager).to.be.equal(await newDocumentManager.getAddress());

      const oldAdminAllowance = await accountIngress.transactionAllowed.staticCall(
        admin,
        other,
        ONE_WEI,
        ONE_GWEI,
        GAS_LIMIT,
        "0x"
      );
      expect(oldAdminAllowance).to.be.false;

      const newAdminAllowance = await accountIngress.transactionAllowed.staticCall(
        newAdmin,
        other,
        ONE_WEI,
        ONE_GWEI,
        GAS_LIMIT,
        "0x"
      );
      expect(newAdminAllowance).to.be.true;
    });
  });
});
