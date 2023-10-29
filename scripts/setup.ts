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

const main = async () => {
  const [admin, manager, signer1, signer2] = await ethers.getSigners();
  const signer1Position = {
    officerAddress: signer1.address,
    divisionId: "H1",
    positionIndex: FIRST_POSITION_INDEX,
  };
  const signer2Position = {
    officerAddress: signer2.address,
    divisionId: "H1",
    positionIndex: FIRST_POSITION_INDEX,
  };

  let contract;

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

  await createDivision(contract, "H1", "Hanoi People's Committee", ROOT_DIVISION_ID);
  await createDivision(contract, "K2", "Hanoi People's Council", ROOT_DIVISION_ID);
  await createDivision(contract, "H1.1", "Ba Dinh People's Committee", "H1");

  await createPosition(
    contract,
    manager.address,
    "H1",
    "Chairman of the People's Committee",
    PositionRole.MANAGER
  );
  await createPosition(
    contract,
    manager.address,
    "K2",
    "Vice Chairman of the People's Council",
    PositionRole.STAFF
  );
  await createPosition(contract, signer1.address, "H1", "Genaral Secret", PositionRole.STAFF);
  await createPosition(contract, signer2.address, "H1", "Vice Chairman", PositionRole.STAFF);

  await publishDoc(
    contract,
    manager,
    {
      number: "10/2022/QH15",
      name: "LUẬT THỰC HIỆN DÂN CHỦ Ở CƠ SỞ",
      docType: "Law",
      divisionId: "H1",
      publishedTimestamp: 1698470312,
    },
    "./data/luat_dan_chu.pdf",
    "H1",
    FIRST_POSITION_INDEX,
    [signer1Position, signer2Position],
    [signer1, signer2]
  );

  await publishDoc(
    contract,
    manager,
    {
      number: "20/2023/QH15",
      name: "LUẬT GIAO DỊCH ĐIỆN TỬ",
      docType: "Law",
      divisionId: "H1",
      publishedTimestamp: 1698670312,
    },
    "./data/luat_giao_dich_dt.pdf",
    "H1",
    FIRST_POSITION_INDEX,
    [signer1Position, signer2Position],
    [signer1, signer2]
  );

  await publishDoc(
    contract,
    manager,
    {
      number: "15/2023/QH15",
      name: "LUẬT KHÁM BỆNH, CHỮA BỆNH",
      docType: "Law",
      divisionId: "H1",
      publishedTimestamp: 1698670312,
    },
    "./data/luat_kham_chua_benh.pdf",
    "H1",
    FIRST_POSITION_INDEX,
    [signer1Position, signer2Position],
    [signer1, signer2]
  );
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
  console.log("Div created:", divisionId);
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
