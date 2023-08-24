import { ethers } from "hardhat";
import { LegalDocumentManager__factory } from "../typechain-types";
import { ContractEvent, ContractEventPayload, EventLog } from "ethers";
import { compressFile } from "./encode";
import { TypedContractEvent } from "../typechain-types/common";

async function main() {
  const [caller, manager] = await ethers.getSigners();

  // const documentManager = await new LegalDocumentManager__factory(caller).deploy();
  // await documentManager.waitForDeployment();
  // console.log("Deployed at:", await documentManager.getAddress());

  // const divisionId = "H26.1.1";
  // const createDivTx = await documentManager.createDivision(divisionId, "UBND Ha Noi", "ROOT");
  // await createDivTx.wait();

  // const createOfficialTx = await documentManager.createOfficial(
  //   manager,
  //   { name: "Nguyen Van A", sex: "Male", dateOfBirth: "01-01-2001" },
  //   divisionId,
  //   0,
  //   { name: "President", role: 2 }
  // );
  // await createOfficialTx.wait();
  // console.log("Set up done");

  //-----------------------------------------------------------------------------------------------
  const documentManager = await ethers.getContractAt(
    "LegalDocumentManager",
    "0xb9A219631Aed55eBC3D998f17C3840B7eC39C0cc"
  );
  const divisionId = "H26.1.1";

  const filter = documentManager.eve

  const data = await compressFile("./common.pdf");
  console.log(`Data length ${data.length}, submitting tx`);
  const tx = await documentManager
    .connect(manager)
    .submitDocument(divisionId, 0, ethers.toUtf8Bytes(data), [], "0x");
  await tx.wait();
  console.log("Tx submitted");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
