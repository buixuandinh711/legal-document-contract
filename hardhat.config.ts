import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-storage-layout";
import "hardhat-log-remover";
import "hardhat-tracer";

const config: HardhatUserConfig = {
  solidity: "0.8.20",
};

export default config;
