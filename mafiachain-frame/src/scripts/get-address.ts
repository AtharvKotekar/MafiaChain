import hre from "hardhat";
const { ethers } = hre;

async function main() {
  // Get the deployer account
  const [deployer] = await ethers.getSigners();

  console.log("🏦 Deployer Wallet Info:");
  console.log("Address:", deployer.address);

  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  const balanceInEth = ethers.formatEther(balance);

  console.log("Balance:", balanceInEth, "ETH");

  if (parseFloat(balanceInEth) < 0.01) {
    console.log("\n❌ Insufficient balance for deployment!");
    console.log("💡 Get testnet ETH from faucets:");
    console.log("🔗 Base Faucet: https://bridge.base.org/deposit");
    console.log("🔗 Alchemy Faucet: https://sepoliafaucet.com");
    console.log("🔗 QuickNode Faucet: https://faucet.quicknode.com/base/sepolia");
  } else {
    console.log("\n✅ Sufficient balance for deployment!");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});