import * as dotenv from "dotenv";
dotenv.config({ path: "../.env" });

/** @type import('hardhat/config').HardhatUserConfig */
export default {
  solidity: "0.8.24",
  paths: {
    sources: "./src",
    artifacts: "./artifacts",
    cache: "./cache",
  },
  networks: {
    amoy: {
      type: "http",
      url: process.env.POLYGON_AMOY_RPC_URL || "https://rpc-amoy.polygon.technology/",
      accounts: [process.env.PRIVATE_KEY || "0000000000000000000000000000000000000000000000000000000000000001"],
    },
    baseSepolia: {
      type: "http",
      url: process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org",
      accounts: [process.env.PRIVATE_KEY || "0000000000000000000000000000000000000000000000000000000000000001"],
    },
  },
};
