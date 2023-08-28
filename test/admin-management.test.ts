import { ethers } from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { LegalDocumentManager, LegalDocumentManager__factory } from "../typechain-types";

describe("SystemAdmin", () => {
  let [admin, newAdmin, other]: SignerWithAddress[] = [];
  let documentManager: LegalDocumentManager;

  beforeEach(async () => {
    [admin, newAdmin, other] = await ethers.getSigners();

    documentManager = await new LegalDocumentManager__factory(admin).deploy();
    await documentManager.waitForDeployment();
  });

  it("Should assign admin to deployer", async () => {
    const contractAdmin = await documentManager.getSystemAdmin();
    expect(contractAdmin).to.be.equal(admin.address);
  });

  describe("Update admin", () => {
    it("Should fail if not updated by current admin", async () => {
      await expect(
        documentManager.connect(other).updateSystemAdmin(newAdmin)
      ).to.be.revertedWithCustomError(documentManager, "NotTheSystemAdmin");
    });

    it("Should succeed to update admin", async () => {
      const tx = await documentManager.connect(admin).updateSystemAdmin(newAdmin);
      await tx.wait();
      const contractAdmin = await documentManager.getSystemAdmin();
      expect(contractAdmin).to.be.equal(newAdmin.address);
    });
  });
});
