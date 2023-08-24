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
  },
};

export default config;
