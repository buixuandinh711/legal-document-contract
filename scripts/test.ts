import { ethers } from "hardhat";
import { PositionRole } from "../utils/contract.type";
import { LegalDocumentManager__factory } from "../typechain-types";

const main = async () => {
  const [admin, acc1] = await ethers.getSigners();

  // const contract = await ethers.getContractAt(
  //   "LegalDocumentManager",
  //   "0x0000000000000000000000000000000000000100"
  // );

  const contract = await new LegalDocumentManager__factory(admin).deploy();
  const tx = await contract.createDivision("H27", "UBND Hanoi", "ROOT");
  await tx.wait();
  // console.log("Tx done:", tx.hash);

  const officerTx = await contract.createOfficer(
    acc1,
    { name: "Dinh Bx", dateOfBirth: "2001", sex: "Male" },
    "H27",
    0,
    { name: "President", role: PositionRole.MANAGER }
  );
  console.log(officerTx.hash);
};

main();
