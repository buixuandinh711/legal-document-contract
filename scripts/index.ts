import { ethers } from "hardhat";

const main = async () => {
  const [caller, evenAcc, oddAcc] = await ethers.getSigners();
  try {
    const tx = await caller.sendTransaction({
      to: oddAcc,
      value: 1,
    });
    const txReceipt = await tx.wait();
    console.log(txReceipt);
  } catch (error) {
    console.log(error);
  }
};

main().catch((err) => {
  console.log(err);
  process.exit(1);
});
