import { ethers } from "hardhat";
import { LegalDocumentManager__factory } from "../typechain-types";
import { ContractEvent, ContractEventPayload, EventLog } from "ethers";

import * as fs from "fs";
import * as zlib from "zlib";

async function compressFile(inputFilePath: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const inputReadStream = fs.createReadStream(inputFilePath);
    const chunks: Buffer[] = [];

    const gzipStream = inputReadStream.pipe(zlib.createGzip());

    gzipStream.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });

    gzipStream.on("end", () => {
      const compressedData = Buffer.concat(chunks);
      const compressedString = compressedData.toString("base64"); // Convert to a base64 string
      resolve(compressedString);
    });

    gzipStream.on("error", reject);
  });
}

async function main() {
  const [caller, manager] = await ethers.getSigners();
  // const documentManager = await new LegalDocumentManager__factory(caller).deploy();
  // await documentManager.waitForDeployment();
  // console.log("Deployed");

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

  const documentManager = await ethers.getContractAt(
    "LegalDocumentManager",
    "0x2Ad8895DcD54eD8B33509E267EFB619154cb620e"
  );

  const divisionId = "H26.1.1";

  documentManager.once("DocumentSubmitted", async (...args) => {
    const txHash = (args[4] as ContractEventPayload).log.transactionHash;
    const tx = await ethers.provider.getTransaction(txHash);
    console.log(txHash);
    console.log(tx?.data.length);
    console.log("Submitted")
  });

  const data = await compressFile("./medium.pdf");
  const tx = await documentManager
    .connect(manager)
    .submitDocument(divisionId, 0, ethers.toUtf8Bytes(data), [], "0x");
  await tx.wait();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
