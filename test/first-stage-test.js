const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("First Phase Contract", function () {

  const prices = [10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,14,17,18,19]
  let deployer
  let buyer
  let nft

  beforeEach(async () => {
     const accounts = await hre.ethers.getSigners();
     deployer = accounts[0]
     buyer = accounts[1]
     // We get the contract to deploy
     const NFT = await hre.ethers.getContractFactory("FirstStage");
     nft = await NFT.deploy(prices);
     await nft.deployed();
  })

  it("Should fail if token does not exists", async function() {
     const price = await nft.getTokenPrice(53);
     const whiteListTx = await nft.addWhitelistedUsers([deployer.address]);
     await whiteListTx.wait()
     await expect(nft.buyToken(61,{value: price.toString()})).to.be.reverted;
  })

  it("Should set baseURI", async function() {
    await expect(nft.setBaseURI("test"))
    .to.emit(nft, 'BaseURIUpdated')
    .withArgs(deployer.address, "test");
  })

  it("Should flip whitelisted status", async function() {
    await expect(nft.flipWhitelistedStatus())
    .to.emit(nft, 'WhitelistedStatusUpdated')
    .withArgs(deployer.address, false);
  })

  it("Should fail flip whitelisted status", async function() {
    await expect(nft.connect(buyer).flipWhitelistedStatus()).to.be.reverted
  })

  it("Should fail set baseURI", async function() {
    await expect(nft.connect(buyer).setBaseURI("test")).to.be.reverted
  })

  it("Should remove whitelisted users", async function() {
    await expect(nft.removeWhitelistedUsers([deployer.address]))
    .to.emit(nft, 'WhitelistUpdated')
    .withArgs(deployer.address,[deployer.address], true);
  })

  it("Should fail remove whitelisted users", async function() {
    await expect(nft.connect(buyer).removeWhitelistedUsers([deployer.address])).to.be.reverted
  })

  it("Should add whitelisted contracts", async function() {
    await expect(nft.addWhitelistedContracts([deployer.address]))
    .to.emit(nft, 'WhitelistContractsUpdated')
    .withArgs(deployer.address,[deployer.address], false);
  })

  it("Should fail add whitelisted users", async function() {
    await expect(nft.connect(buyer).addWhitelistedContracts([deployer.address])).to.be.reverted
  })

  it("Should fail add empty whitelisted users", async function() {
    await expect(nft.connect(buyer).addWhitelistedUsers([])).to.be.reverted
  })

  it("Should fail add empty whitelisted users", async function() {
    await expect(nft.addWhitelistedUsers([])).to.be.reverted
  })

  it("Should fail add empty whitelisted contracts", async function() {
    await expect(nft.addWhitelistedContracts([])).to.be.reverted
  })

  it("Should fail remove empty whitelisted contracts", async function() {
    await expect(nft.removeWhitelistedContracts([])).to.be.reverted
  })

  it("Should fail remove empty whitelisted users", async function() {
    await expect(nft.removeWhitelistedUsers([])).to.be.reverted
  })


  it("Should remove whitelisted contracts", async function() {
    await expect(nft.removeWhitelistedContracts([deployer.address]))
    .to.emit(nft, 'WhitelistContractsUpdated')
    .withArgs(deployer.address,[deployer.address], true);
  })

  it("Should fail remove whitelisted contracts", async function() {
    await expect(nft.connect(buyer).removeWhitelistedContracts([deployer.address])).to.be.reverted
  })

  it("Should flip whitelisted status", async function() {
    await expect(nft.flipPausedStatus())
    .to.emit(nft, 'StatusUpdated')
    .withArgs(deployer.address, true);
  })

  it("Should set token price", async function() {
    await expect(nft.setTokenPrice(1, String(5e18)))
    .to.emit(nft, 'PriceUpdated')
    .withArgs(deployer.address,1, String(5e18));
  })

  it("Should fail set token price", async function() {
    await expect(nft.setTokenPrice(5000, String(5e18))).to.be.reverted;
  })

  it("Should fail set token price", async function() {
    await expect(nft.connect(buyer).setTokenPrice(5, String(5e18))).to.be.reverted;
  })

  it("Should fail set token price", async function() {
    await expect(nft.setTokenPrice(1, 0)).to.be.reverted;
  })
  
  it("Should withdraw coins", async function() {
    // get nft price 
    const price = await nft.getTokenPrice(53);

    // whitelist user
    const whiteListTx = await nft.addWhitelistedUsers([deployer.address]);
    await whiteListTx.wait()
    // buy nfts 
    const buyTx = await nft.buyToken(53,{value: price.toString()})
    await buyTx.wait()

    const blockNumber = await ethers.provider.getBlockNumber()
    const block = await ethers.provider.getBlock(blockNumber)
    const timestamp = block.timestamp;

    await expect(nft.withdraw())
    .to.emit(nft, 'WithdrawFunds')
    .withArgs(deployer.address, price.toString(), timestamp + 1, "0x0000000000000000000000000000000000000000");
  })

  it("Should return owned token", async function() {
    // get nft price 
    const price = await nft.getTokenPrice(53);

    // whitelist user
    const whiteListTx = await nft.addWhitelistedUsers([deployer.address]);
    await whiteListTx.wait()
    // buy nfts 
    const buyTx = await nft.buyToken(53,{value: price.toString()})
    await buyTx.wait()

    const owned = await nft.Owned(deployer.address)

    expect(owned[0].toNumber()).to.equal(53);
  })

  it("Should detect whitelisted contract", async function() {
    // get nft price 
    const price = await nft.getTokenPrice(53);

    const airdropTx = await nft.airdropToken(2,buyer.address);
    await airdropTx.wait()

    const ownerOfToken = await nft.ownerOf(2)
    await expect(ownerOfToken).to.equal(buyer.address);

    // whitelist this contract
    const whiteListTx2 = await nft.addWhitelistedContracts([nft.address]);
    await whiteListTx2.wait

    // buy nfts
    const buyTx = await nft.connect(buyer).buyToken(53,{value: price.toString()})
    await buyTx.wait()

    const owned = await nft.Owned(buyer.address)

    expect(owned[0].toNumber()).to.equal(2);
    expect(owned[1].toNumber()).to.equal(53);
  })

  it("Should fail buy when paused", async function() {
    // get nft price 
    const price = await nft.getTokenPrice(53);

    // whitelist user
    const whiteListTx = await nft.addWhitelistedUsers([deployer.address]);
    await whiteListTx.wait()
    //pause 
    const pauseTx = await nft.flipPausedStatus()
    await pauseTx.wait()
    // buy nfts 
    await expect(nft.buyToken(53,{value: price.toString()})).to.be.reverted;
  })

  it("Should buy when not whitelist off", async function() {
    // get nft price 
    const price = await nft.getTokenPrice(53);
    const flTx = await nft.flipWhitelistedStatus()
    await flTx.wait()
    // whitelist user
    const whiteListTx = await nft.addWhitelistedContracts([deployer.address]);
    await whiteListTx.wait()
    // buy nfts 
    const buyTx = await nft.buyToken(53,{value: price.toString()})
    await buyTx.wait()

    const ownerOfToken = await nft.ownerOf(53)
    await expect(ownerOfToken).to.equal(deployer.address);

  })

  it("Should return empty array", async function() {
    const owned = await nft.Owned(deployer.address)
    console.log(owned)
    expect(owned.length).to.equal(0);
  })

  it("Should return token uri", async function() {
    // get nft price 
    const price = await nft.getTokenPrice(53);

    // whitelist user
    const whiteListTx = await nft.addWhitelistedUsers([deployer.address]);
    await whiteListTx.wait()
    // buy nfts 
    const buyTx = await nft.buyToken(53,{value: price.toString()})
    await buyTx.wait()

    const bsUrl = await nft.setBaseURI("http://localhost/")
    await bsUrl.wait()

    const uri = await nft.tokenURI(53)

    expect(uri).to.equal("http://localhost/53");
  })

  it("Should fail if token does not exists", async function() {
    await expect(nft.withdrawTokens(deployer.address)).to.be.reverted;
  })

  it("Should fail if user is not WL", async function() {
    // get nft price 
    const price = await nft.getTokenPrice(53);
    // buy nfts 
    await expect(nft.buyToken(53,{value: price.toString()})).to.be.reverted;
  })

  it("Should airdrop token to address", async function() {
     const airdropTx = await nft.airdropToken(2,deployer.address);
     await airdropTx.wait()
     const ownerOfToken = await nft.ownerOf(2)
     await expect(ownerOfToken).to.equal(deployer.address);
  })

  it("Should not airdrop token to address if not owner", async function() {
      await expect(nft.connect(buyer).airdropToken(2,deployer.address)).to.be.revertedWith("Ownable: caller is not the owner");
  })

  it("Should return total supply after sale finished", async function () {
    // get nft price 
    const price = await nft.getTokenPrice(53);

  
    // whitelist user
    const whiteListTx = await nft.addWhitelistedUsers([deployer.address]);
    await whiteListTx.wait()
  
    // buy nfts 
    const buyTx = await nft.buyToken(53,{value: price.toString()})
    await buyTx.wait()
    // get total supply
    let totalSupply = await nft.totalSupply()
    // burn nfts

    expect(totalSupply.toNumber()).to.equal(1);
  });

  it("Should return total supply after full mint", async function () {
   let tokenId = 0;
   while(true) {
    try{
      // get nft price 
      const price = await nft.getTokenPrice(tokenId);

      // whitelist user
      const whiteListTx = await nft.addWhitelistedUsers([deployer.address]);
      await whiteListTx.wait()

      // buy nfts 
      const buyTx = await nft.buyToken(tokenId,{value: price.toString()})
      await buyTx.wait()
      tokenId++
    }
    catch {
      break;
    }
   }
    // get total supply
    let totalSupply = await nft.totalSupply()
    // burn nfts

    expect(totalSupply.toNumber()).to.equal(61);
  });
});
