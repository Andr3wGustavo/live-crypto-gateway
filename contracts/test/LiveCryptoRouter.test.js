import hardhat from "hardhat";
import assert from "node:assert";

describe("LiveCryptoRouter Smart Contract Suite", function () {
  let router;
  let owner, treasury, streamer, donor;
  const feePercentage = 200; // 2%

  beforeEach(async function () {
    const { ethers } = hardhat;
    [owner, treasury, streamer, donor] = await ethers.getSigners();

    const Router = await ethers.getContractFactory("LiveCryptoRouter");
    router = await Router.deploy(treasury.address, feePercentage);
    await router.waitForDeployment();
  });

  it("Should set the correct platform treasury and fee percentage", async function () {
    assert.strictEqual(await router.platformTreasury(), treasury.address);
    assert.strictEqual(Number(await router.feePercentage()), feePercentage);
    assert.strictEqual(await router.owner(), owner.address);
  });

  it("Should route native currency donation correctly (98% to streamer, 2% to treasury)", async function () {
    const { ethers } = hardhat;
    const donationAmount = ethers.parseEther("1.0"); // 1 ETH/MATIC

    const initialStreamerBalance = await ethers.provider.getBalance(streamer.address);
    const initialTreasuryBalance = await ethers.provider.getBalance(treasury.address);

    const tx = await router.connect(donor).donateNative(streamer.address, { value: donationAmount });
    await tx.wait();

    const finalStreamerBalance = await ethers.provider.getBalance(streamer.address);
    const finalTreasuryBalance = await ethers.provider.getBalance(treasury.address);

    const expectedFee = ethers.parseEther("0.02"); // 2% of 1.0
    const expectedNet = ethers.parseEther("0.98"); // 98% of 1.0

    assert.strictEqual(finalStreamerBalance - initialStreamerBalance, expectedNet);
    assert.strictEqual(finalTreasuryBalance - initialTreasuryBalance, expectedFee);
  });

  it("Should allow the owner to update fee percentage within the 10% safety cap", async function () {
    await router.connect(owner).setFeePercentage(300); // 3%
    assert.strictEqual(Number(await router.feePercentage()), 300);
  });
});
