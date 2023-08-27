import { ethers } from "hardhat";

const main = async () => {
  const [caller, evenAcc, oddAcc] = await ethers.getSigners();
  const docSystem = await ethers.getContractAt(
    "LegalDocumentManager",
    "0x0000000000000000000000000000000000008888"
  );
  const tx = await oddAcc.sendTransaction({
    to: evenAcc.address,
    value: 1,
  });
  await tx.wait();
};

main().catch((err) => {
  console.log(err);
  process.exit(1);
});
