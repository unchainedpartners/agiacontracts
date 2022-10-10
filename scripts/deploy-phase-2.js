// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const { ethers } = require("hardhat");

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {


  let prices = [10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19]
  prices = prices.map(price => ethers.utils.parseEther(((price + 5) / 100).toString()));
  const baseDelta = (parseInt(new Date() / 1000) + 5000).toString()
  const firstStage = "0xD8a66382d483e83e7C187fA0937bC945D9AEEA46"
  const constructorData = [prices, firstStage, baseDelta]
   //compile again
  await hre.run('compile');
  // We get the contract to deploy
  const NFT = await hre.ethers.getContractFactory("SecondStage");
  console.log("Starting Deployment")
  const nft = await NFT.deploy(prices, firstStage, baseDelta);

  await nft.deployed();
  console.log("NFT deployed to:", nft.address);

  console.log("Waiting 6 sec");
  sleep(6000)

  await hre.run("verify:verify", {
    address: nft.address,
    contract: "contracts/SecondStage721.sol:SecondStage",
    constructorArguments: [...constructorData]
  });

  
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
