import { ethers } from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { LegalDocumentManager, LegalDocumentManager__factory } from "../typechain-types";
import { PositionRole } from "../utils/contract.type";
import {
  ADMIN_POSITION_INDEX,
  MAX_POSITION_INDEX,
  ROOT_DIVISION_ID,
  signDocument,
  toEthersResult,
} from "../utils/utils";

describe("LegalDocumentManager", () => {
  const DIVISION_ID = "H26";
  const DIVISION_NAME = "UBND Hanoi";
  const OFFICER_INFO = {
    name: "Nguyen Van A",
    sex: "Male",
    dateOfBirth: "01/01/2001",
  };
  const MANAGER_POSITION = {
    name: "President",
    role: PositionRole.MANAGER,
  };
  const [FIRST_POSITION_INDEX, SECOND_POSITION_INDEX] = [0, 1];
  const DOCUMENT_CONTENT =
    "0x1f8b08000000000000ff8555cb6edb4810bcf32b7a7d88254396b18f43c0240e168b7de8b06bc0fbb82c16d1886c4ab322679899a164c6f0bfa77a86a494c4407412e751dd55dd5db33274dff9b020459baeaad891f614fa5617aaae7b72dc3af66c0297a43c0ead5ffcdbbdfc6f4d1b2e54e79974b89465c7b8caa6600a169f9edf77f1cb56b4e903fb25fdb50370c95e6f0d153babb1b903a2e7033b55932a0fca04b5659f67d9b74bbabafa53551cfaabab9cfef6da6c9f0952ebb308c4c677c895c24e05ea6d47853274b46e4f471d7658e691a17cdb2e903010e4861beb7aea8c8f21975111d0b247c3ceef744bca94b4b1ced9a39cf7bd0fdcd0b6530e39f367312f0335b6d4551f431616274cf092e73329f0430b161a57baa03635932a0af67e4190fd807b12aeb04d630d56ecd6a9a69125462ace53adf713a2858e556d8f7e9965df897e3f5715902157d4f0c7afa8371b0a3ba7d2b217123b75403aa63f93c17303c2ba40395781bc6e5ab4486bb5f08ba0d0631b4193a443d51b56e6b3ba148e5560b0ae836e417b4a2e0289505e355f16ccb6bdd097fd5205b5a0e34e173b69591ed886582b75b0baf4a8a8619153a1ba4391d1d5b65041435039382042b3ef45b35fd94837ead47763af6be970c8dbd336edcb8070222464a621a18372da769ef6da94b1e4294b6303fd8f9ea2c00f81ac231f1ca226190561c384612aa9c2de461bc937ddd40d4662f8efd969e4f601e7d2821000291e64de4ec953a3f650126de53b9dfa4a9015842cf9542499df42799696f941e8afd0abceb640d9e85184dfa505563777319ae12013253588c74447c4491e12f146cd50c5d3eca5323e6f0248780b8c23d7753a3c0cdf0764725d58c0aa0de452458a958ad6b4089d724c97d0f8d73526a61e87530b954a1591dc6fe82db1298379538df41bd8efec71caf6bc06c81ccd9934a6cad906ba551a770069279b844badd76b875c33a1ed4399e795cff35f70f2d56949db3c7ff45c570bba07e8d3ab2cab0ccaa3cd6c4ed7b724fbf7ec3106af67f35b7acc08bf9b1bba6bd98c71a5749211548fdb3547bb489b6f4822e639ca61661703bd65780817f3b70836c0fd94c66df27810f1019d13276962fb09fa70f20dfdc3459e1b3ecee627bcfb4f0512949344279b8bc765632931de05fb8e4d397b71823fcff10f7b5cd0655abf8cbe0995fcb3261a63e1f188d58bf75bcc53a8cd37b38bc7fcedd3c562c41fe0eff6b3d97c9e3d49cdb26c6580229e91d4828bc4d2cbeb06b2afbb97b76b413fb3eb2f7b624c43229d6c4dd5de46288b7d176d22263d0c00e6d9147557c64744fcf7dc7765409d533d4e958c6ac653b02960c3305a2e341c0e13c8651c24a63df7f1b1161b42383f66ebc5e4ce4c697c8cfde4f6a36f8eb3773676834da697304e1b4fef086d2d082e3f02fb80901d33080000";

  let admin: SignerWithAddress;
  let divisionManager: SignerWithAddress;
  let other: SignerWithAddress;
  let signer1: SignerWithAddress;
  let signer2: SignerWithAddress;
  let documentManager: LegalDocumentManager;
  let signatures: string;
  let documentSigners: SignerWithAddress[];

  beforeEach(async function () {
    [admin, divisionManager, other, signer1, signer2] = await ethers.getSigners();

    documentSigners = [divisionManager, signer1, signer2];
    signatures = await signDocument(DOCUMENT_CONTENT, documentSigners);

    documentManager = await new LegalDocumentManager__factory(admin).deploy();
    await documentManager.waitForDeployment();

    const createDivTx = await documentManager
      .connect(admin)
      .createDivision(DIVISION_ID, DIVISION_NAME, ROOT_DIVISION_ID);
    await createDivTx.wait();

    const createManagerTx = await documentManager.createOfficer(divisionManager, OFFICER_INFO);
    await createManagerTx.wait();

    const createManagerPositionTx = await documentManager
      .connect(admin)
      .createPosition(divisionManager, DIVISION_ID, MANAGER_POSITION, ADMIN_POSITION_INDEX);
    await createManagerPositionTx.wait();
  });

  describe("Submit document", () => {
    it("Should fail to submit document if division manager not active", async () => {
      const deactivateTx = await documentManager.connect(admin).deactivateOfficer(divisionManager);
      await deactivateTx.wait();

      await expect(
        documentManager
          .connect(divisionManager)
          .submitDocument(
            DIVISION_ID,
            FIRST_POSITION_INDEX,
            DOCUMENT_CONTENT,
            documentSigners,
            signatures
          )
      ).to.be.revertedWithCustomError(documentManager, "OfficerNotActive");
    });

    it("Should fail to submit document if division not active", async () => {
      const deactivateTx = await documentManager.connect(admin).deactivateDivision(DIVISION_ID);
      await deactivateTx.wait();

      await expect(
        documentManager
          .connect(divisionManager)
          .submitDocument(
            DIVISION_ID,
            FIRST_POSITION_INDEX,
            DOCUMENT_CONTENT,
            documentSigners,
            signatures
          )
      ).to.be.revertedWithCustomError(documentManager, "DivisionNotActive");
    });

    it("Should fail to submit document if division manager position index out of range", async () => {
      await expect(
        documentManager
          .connect(divisionManager)
          .submitDocument(
            DIVISION_ID,
            MAX_POSITION_INDEX + 1,
            DOCUMENT_CONTENT,
            documentSigners,
            signatures
          )
      ).to.be.revertedWithCustomError(documentManager, "PositionIndexOutOfRange");
    });

    it("Should fail to submit document if division manager position index not assigned", async () => {
      await expect(
        documentManager
          .connect(divisionManager)
          .submitDocument(
            DIVISION_ID,
            SECOND_POSITION_INDEX,
            DOCUMENT_CONTENT,
            documentSigners,
            signatures
          )
      ).to.be.revertedWithCustomError(documentManager, "PositionIndexNotAssigned");
    });

    it("Should fail to submit document if creator not have division manager role", async () => {
      const createOfficerTx = await documentManager
        .connect(admin)
        .createOfficer(other, { name: "Nguyen Staff", sex: "Male", dateOfBirth: "01/01/2001" });
      await createOfficerTx.wait();

      const createPositionTx = await documentManager
        .connect(admin)
        .createPosition(
          other,
          DIVISION_ID,
          { name: "Admin", role: PositionRole.STAFF },
          ADMIN_POSITION_INDEX
        );
      await createPositionTx.wait();

      await expect(
        documentManager
          .connect(other)
          .submitDocument(
            DIVISION_ID,
            FIRST_POSITION_INDEX,
            DOCUMENT_CONTENT,
            documentSigners,
            signatures
          )
      ).to.be.revertedWithCustomError(documentManager, "NotTheDivisionManager");
    });

    it("Should fail to submit document if signers and signatures length not match", async () => {
      await expect(
        documentManager
          .connect(divisionManager)
          .submitDocument(
            DIVISION_ID,
            FIRST_POSITION_INDEX,
            DOCUMENT_CONTENT,
            documentSigners,
            signatures.concat("1234")
          )
      ).to.be.revertedWithCustomError(documentManager, "SignersSignaturesLengthNotMatch");
    });

    it("Should fail to submit document if signatures invalid", async () => {
      const invalidSignatures = await signDocument(DOCUMENT_CONTENT, [other, signer1, signer2]);

      await expect(
        documentManager
          .connect(divisionManager)
          .submitDocument(
            DIVISION_ID,
            FIRST_POSITION_INDEX,
            DOCUMENT_CONTENT,
            documentSigners,
            invalidSignatures
          )
      ).to.be.revertedWithCustomError(documentManager, "InvalidSignature");
    });

    it("Should succeed to submit document", async () => {
      const submitTx = await documentManager
        .connect(divisionManager)
        .submitDocument(
          DIVISION_ID,
          FIRST_POSITION_INDEX,
          DOCUMENT_CONTENT,
          documentSigners,
          signatures
        );

      await submitTx.wait();

      const documentHash = ethers.keccak256(DOCUMENT_CONTENT);

      await expect(submitTx)
        .to.emit(documentManager, "DocumentSubmitted")
        .withArgs(
          documentHash,
          DIVISION_ID,
          FIRST_POSITION_INDEX,
          toEthersResult(documentSigners.map((s) => s.address))
        );
    });
  });
});
