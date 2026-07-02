import hardhat from "hardhat";

async function main() {
  const { ethers } = hardhat;
  console.log("Starting deployment...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance));

  // Config: Set treasury address and fee percentage (200 = 2%)
  const treasuryAddress = deployer.address; // For testing, deployer is treasury
  const feePercentage = 200;

  const Router = await ethers.getContractFactory("LiveCryptoRouter");
  const router = await Router.deploy(treasuryAddress, feePercentage);

  await router.waitForDeployment();

  const routerAddress = await router.getAddress();
  console.log("LiveCryptoRouter deployed to:", routerAddress);
  
  console.log("Deployment complete! Make sure to update the frontend ABI and contract address.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error deploying contract:", error);
    process.exit(1);
  });
