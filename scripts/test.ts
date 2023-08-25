import { ethers } from "hardhat";
import { LegalDocumentManager__factory } from "../typechain-types";
import { BytesLike, ContractEvent, ContractEventPayload, EventLog } from "ethers";
import { compressFile, decompressAndSaveToFile } from "./encode";

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

  documentManager.once(documentManager.getEvent("DocumentSubmitted"), async (...args) => {
    const eventData = args[4] as unknown as ContractEventPayload;
    const txHash = eventData.log.transactionHash;
    console.log(txHash);
    const tx = await ethers.provider.getTransaction(txHash);
    if (tx) {
      const parsedTx = documentManager.interface.parseTransaction(tx);
      if (parsedTx) {
        const docContent = parsedTx.args[2];
        const base64Content = ethers.toUtf8String(docContent);
        await decompressAndSaveToFile(base64Content, `out/decodedOut-${new Date().getTime()}.pdf`);
      }
    }
  });

  const data = await compressFile("./medium.pdf");
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
