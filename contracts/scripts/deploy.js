import hardhat from "hardhat";

async function main() {
  const { ethers } = hardhat;
  const treasuryAddress = process.env.PLATFORM_TREASURY;
  const feePercentage = Number(process.env.PLATFORM_FEE_BPS || 200);
  if (!process.env.PRIVATE_KEY) throw new Error('PRIVATE_KEY is required to deploy');
  if (!treasuryAddress || !ethers.isAddress(treasuryAddress)) throw new Error('PLATFORM_TREASURY must be a valid address');
  if (!Number.isInteger(feePercentage) || feePercentage < 0 || feePercentage > 1000) throw new Error('PLATFORM_FEE_BPS must be between 0 and 1000');
  console.log("Starting deployment...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance));

  const Router = await ethers.getContractFactory("LiveCryptoRouter");
  const router = await Router.deploy(treasuryAddress, feePercentage);

  await router.waitForDeployment();

  const routerAddress = await router.getAddress();
  console.log("LiveCryptoRouter deployed to:", routerAddress);
  
  console.log("Deployment complete. Run npm run sync:abi and configure EVM_ROUTER_ADDRESS in backend/.env.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error deploying contract:", error);
    process.exit(1);
  });
