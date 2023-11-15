import { ethers, network } from "hardhat";
import {
  ADMIN_POSITION_INDEX,
  FIRST_POSITION_INDEX,
  ROOT_DIVISION_ID,
  signDocument,
} from "../utils/utils";
import { DocumentInfo, OfficerPosition, PositionRole } from "../utils/contract.type";
import { LegalDocumentManager, LegalDocumentManager__factory } from "../typechain-types";
import * as fs from "fs/promises";
import * as flate from "wasm-flate";
import { BigNumberish } from "ethers";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { ministries, provinces_commitee, provinces_council } from "./data";

const main = async () => {
  const [admin, ministry1, ministry2, ministry3, commitee1, commitee2, commitee3] =
    await ethers.getSigners();
  const signer1Position = {
    officerAddress: ministry2.address,
    divisionId: "H1",
    positionIndex: FIRST_POSITION_INDEX,
  };
  const signer2Position = {
    officerAddress: ministry3.address,
    divisionId: "H1",
    positionIndex: FIRST_POSITION_INDEX,
  };

  let contract: LegalDocumentManager;

  if (network.name === "hardhat") {
    contract = await new LegalDocumentManager__factory(admin).deploy();
  } else {
    contract = await ethers.getContractAt(
      "LegalDocumentManager",
      "0x0000000000000000000000000000000000000100"
    );
  }

  await createOfficer(contract, manager.address, "Bui Xuan Dinh", "07/01/2001", "Male");
  await createOfficer(contract, signer1.address, "Nguyen Van A", "01/01/2001", "Male");
  await createOfficer(contract, signer2.address, "Nguyen Thi B", "01/01/1990", "Female");

  await createOfficer(contract, commitee1.address, "Trần Văn Nam", "07/01/2001", "Male");
  await createOfficer(contract, commitee2.address, "Bùi Văn Cường", "01/01/2001", "Male");
  await createOfficer(contract, commitee3.address, "Phạm Thị Hương", "01/01/1990", "Female");

  for (const div of provinces_commitee) {
    await createDivision(contract, div.id, div.name, ROOT_DIVISION_ID);
  }

  for (const div of provinces_council) {
    await createDivision(contract, div.id, div.name, ROOT_DIVISION_ID);
  }

  for (const div of ministries) {
    await createDivision(contract, div.id, div.name, ROOT_DIVISION_ID);
  }

  await createPosition(contract, ministry1.address, "G01", "Bộ trưởng", PositionRole.MANAGER);
  await createPosition(contract, ministry2.address, "G01", "Thứ trưởng", PositionRole.MANAGER);
  await createPosition(contract, ministry3.address, "G01", "Thư ký", PositionRole.STAFF);

  await createPosition(contract, commitee1.address, "H26", "Chủ tịch UBND", PositionRole.MANAGER);
  await createPosition(
    contract,
    commitee2.address,
    "H26",
    "Phó chủ tịch UBND",
    PositionRole.MANAGER
  );
  await createPosition(contract, commitee3.address, "H26", "Thư ký", PositionRole.STAFF);
};

const createOfficer = async (
  contract: LegalDocumentManager,
  officerAddress: string,
  name: string,
  dateOfBirth: string,
  sex: string
) => {
  const createOffierTx = await contract.createOfficer(officerAddress, { name, dateOfBirth, sex });
  await createOffierTx.wait();
  console.log("Officer created:", officerAddress);
};

const createDivision = async (
  contract: LegalDocumentManager,
  divisionId: string,
  name: string,
  supervisoryId: string
) => {
  const createDivTx = await contract.createDivision(divisionId, name, supervisoryId);
  await createDivTx.wait();
  console.log("Div created:", divisionId, name);
};

const createPosition = async (
  contract: LegalDocumentManager,
  officerAddress: string,
  divisionId: string,
  name: string,
  role: PositionRole
) => {
  const createPositionTx = await contract.createPosition(
    officerAddress,
    divisionId,
    { name, role },
    ADMIN_POSITION_INDEX
  );
  await createPositionTx.wait();
  console.log("Position created: ", officerAddress, divisionId);
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const publishDoc = async (
  contract: LegalDocumentManager,
  publisher: SignerWithAddress,
  docInfo: DocumentInfo,
  docContentPath: string,
  divisionId: string,
  publisherPositionIndex: BigNumberish,
  signersPosition: OfficerPosition[],
  signers: SignerWithAddress[]
) => {
  const docContent = await readFile(docContentPath);

  const signatures = await signDocument(docInfo, docContent, signersPosition, signers);
  const publishTx = await contract
    .connect(publisher)
    .publishDocument(
      divisionId,
      publisherPositionIndex,
      docInfo,
      docContent,
      signersPosition,
      signatures
    );
  await publishTx.wait();
  console.log("Document published", docInfo, ethers.keccak256(docContent));
};

const readFile = async (path: string) => {
  const buffer = await fs.readFile(path);
  const compressed = flate.gzip_encode_raw(buffer);
  console.log(ethers.hexlify(compressed).length);
  return compressed;
};

main();
