import { ethers } from "hardhat";
import { ADMIN_POSITION_INDEX, ROOT_DIVISION_ID } from "../utils/utils";
import { PositionRole } from "../utils/contract.type";
import { LegalDocumentManager } from "../typechain-types";

const main = async () => {
  const [, acc1, acc2] = await ethers.getSigners();

  const contract = await ethers.getContractAt(
    "LegalDocumentManager",
    "0x0000000000000000000000000000000000000100"
  );

  await createOfficer(contract, acc1.address, "Bui Xuan Dinh", "07/01/2001", "Male");
  await createOfficer(contract, acc2.address, "Nguyen Van A", "01/01/2001", "Male");

  await createDivision(contract, "H1", "Hanoi People's Committee", ROOT_DIVISION_ID);
  await createDivision(contract, "K2", "Hanoi People's Council", ROOT_DIVISION_ID);
  await createDivision(contract, "H1.1", "Ba Dinh People's Committee", "H1");

  await createPosition(
    contract,
    acc1.address,
    "H1",
    "Chairman of the People's Committee",
    PositionRole.MANAGER
  );
  await createPosition(
    contract,
    acc1.address,
    "K2",
    "Vice Chairman of the People's Council",
    PositionRole.STAFF
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

main();
