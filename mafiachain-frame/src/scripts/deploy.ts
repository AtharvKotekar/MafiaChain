import hre from "hardhat";
const { ethers, run } = hre;

async function main() {
  console.log("🚀 Deploying SimpleMafiaEscrow contract...");

  // Get the contract factory
  const SimpleMafiaEscrow = await ethers.getContractFactory("SimpleMafiaEscrow");

  // Deploy the contract
  console.log("⏳ Deploying contract...");
  const contract = await SimpleMafiaEscrow.deploy();

  // Wait for deployment to be mined
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();

  console.log("✅ SimpleMafiaEscrow deployed to:", contractAddress);
  console.log("📋 Transaction hash:", contract.deploymentTransaction()?.hash);

  // Verify contract on etherscan if not local network
  const network = await ethers.provider.getNetwork();
  if (network.chainId !== BigInt(1337) && network.chainId !== BigInt(31337)) {
    console.log("⏳ Waiting for block confirmations...");
    await contract.deploymentTransaction()?.wait(5);

    console.log("🔍 Verifying contract on block explorer...");
    try {
      await run("verify:verify", {
        address: contractAddress,
        constructorArguments: [],
      });
      console.log("✅ Contract verified successfully");
    } catch (error) {
      console.log("❌ Verification failed:", error);
    }
  }

  console.log(`
🎯 Deployment Summary:
- Contract Address: ${contractAddress}
- Network: ${network.name} (${network.chainId})
- Entry Fee: 0.001 ETH
- Max Players: 9
- Dispute Window: 1 hour

📝 Next Steps:
1. Update NEXT_PUBLIC_CONTRACT_ADDRESS in your .env.local
2. Fund the deployer wallet with testnet ETH
3. Test contract functions with Hardhat console
  `);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});