import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
// import "hardhat-storage-layout";
import "hardhat-log-remover";
// import "hardhat-tracer";

const config: HardhatUserConfig = {
  solidity: "0.8.19",
  networks: {
    mumbai: {
      url: "https://polygon-mumbai.g.alchemy.com/v2/zP7ONa57Y0dtexURJSfRC0e49JVM-qeO",
      chainId: 80001,
      accounts: [
        process.env.PRIVATE_KEY_DEV ||
          "0x9a9c92b1a01fda896e0be2da17cdd41fccc9817d0aec0f12a08c088865702393",
        "2ec1418519d234b8e33544b400421e8b816d47338cab6e74ee4203be517b3fbb",
      ],
    },
    besu: {
      url: "http://127.0.0.1:8545",
      chainId: 1337,
      accounts: [
        "ae6ae8e5ccbfb04590405997ee2d52d2b330726137b875053c36d94e974d162f",
        "2ec1418519d234b8e33544b400421e8b816d47338cab6e74ee4203be517b3fbb",
        "c75334aec346422a9162ad81516955827358d2e47b84c6fa581c981d82592fa2"
      ],
      blockGasLimit: 1125899906842623,
    },
  },
};

export default config;
