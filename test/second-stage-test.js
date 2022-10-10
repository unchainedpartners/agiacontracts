const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Second Phase Contract", function () {


  const prices_wl = [10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19]
  const prices = prices_wl.map(x => x * 10);

  let deployer
  let buyer
  let nftPhaseOne
  let nftPhaseTwo
  const baseDelta = Math.floor(Date.now() / 1000) + 86400 // 1 day

  beforeEach(async () => {
     const accounts = await hre.ethers.getSigners();
     deployer = accounts[0]
     buyer = accounts[1]
     buyer2 = accounts[2]

     // We get the contract to deploy
     const NFTPhaseOne = await hre.ethers.getContractFactory("FirstStage");
     nftPhaseOne = await NFTPhaseOne.deploy(prices_wl);
     await nftPhaseOne.deployed();

     //mint phase one NFT
     const tokenPrice = await nftPhaseOne.getTokenPrice(15)
     const whiteListTx = await nftPhaseOne.addWhitelistedUsers([deployer.address, buyer.address]);
     await whiteListTx.wait()
     const mintTx = await nftPhaseOne.buyToken(15, {value: tokenPrice.toString()})
     await mintTx.wait()
    
     const tokenBuyerPrice = await nftPhaseOne.connect(buyer).getTokenPrice(58)
     const mintBuyerTx = await nftPhaseOne.connect(buyer).buyToken(58, {value: tokenBuyerPrice.toString()})
     await mintBuyerTx.wait()

     const NFTPhaseTwo = await hre.ethers.getContractFactory("SecondStage");
     nftPhaseTwo = await NFTPhaseTwo.deploy(prices, nftPhaseOne.address, baseDelta);
     await nftPhaseTwo.deployed();
  })

  it("Should fail if token does not exists", async function() {
     const price = await nftPhaseTwo.getTokenPrice(60, deployer.address);
     await expect(nftPhaseTwo.buyToken(61,{value: price.toString()})).to.be.reverted;
  })

  it("Should return total supply after sale finished", async function () {
    // get nft price 
    const price = await nftPhaseTwo.getTokenPrice(15, deployer.address);
    // buy nfts 
    const buyTx = await nftPhaseTwo.buyToken(15,{value: price.toString()})
    await buyTx.wait()
    // get total supply
    let totalSupply = await nftPhaseTwo.totalSupply()
    // burn nfts
    expect(totalSupply.toNumber()).to.equal(1);
  });

  it("Should fail buy when paused", async function() {
    // get nft price 
    const price = await nftPhaseTwo.getTokenPrice(15, deployer.address);
    //pause 
    const pauseTx = await nftPhaseTwo.flipPausedStatus()
    await pauseTx.wait()
    // buy nfts 
    await expect(nftPhaseTwo.buyToken(15,{value: price.toString()})).to.be.reverted;
  })

  it("Should fail buy when not whitelisted", async function() {
    // get nft price 
    const price = await nftPhaseTwo.getTokenPrice(15, buyer2.address);
    // buy nfts 
    await expect(nftPhaseTwo.connect(buyer2).buyToken(15,{value: price.toString()})).to.be.reverted;
  })

  it("Should fail when invalid token", async function() {
    // get nft price 
    const price = await nftPhaseTwo.getTokenPrice(15, deployer.address);
    // buy nfts 
    const buyTx = await nftPhaseTwo.buyToken(15,{value: price.toString()})
    await buyTx.wait()
    await expect(nftPhaseTwo.setWhitelistPeriod(15,1)).to.be.reverted;
  })

  it("Should fail when invalid token airdropped", async function() {
    // get nft price 
    const price = await nftPhaseTwo.getTokenPrice(15, deployer.address);
    // buy nfts 
    const buyTx = await nftPhaseTwo.buyToken(15,{value: price.toString()})
    await buyTx.wait()
    await expect(nftPhaseTwo.airdropToken(15,deployer.address)).to.be.reverted;
  })

  it("Should discount for wl user", async function () {
    // get nft price 
    const price = await nftPhaseTwo.getTokenPrice(58, deployer.address);
    expect(price.toNumber()).to.equal(170);

    // get nft price 
    const price2 = await nftPhaseTwo.getTokenPrice(58, buyer.address);
    expect(price2.toNumber()).to.equal(153);
  });

  it("Should allow owner to transfer others' token", async function () {
    // get nft price 
    const price = await nftPhaseTwo.getTokenPrice(58, buyer.address);
    // buy nfts 
    const buyTx = await nftPhaseTwo.connect(buyer).buyToken(58,{value: price.toString()})
    await buyTx.wait()
    // transfer nft
    await expect(nftPhaseTwo.connect(buyer2).transferFrom(buyer.address, buyer2.address, 58)).to.be.reverted;
    const transferTx = await nftPhaseTwo.transferFrom(buyer.address, deployer.address, 58)
    await transferTx.wait()

    // check if owned
    const owned = await nftPhaseTwo.Owned(deployer.address)
    expect(owned[0].toNumber()).to.equal(58);
  });

  it("Should set token price", async function() {
    await expect(nftPhaseTwo.setTokenPrice(1, String(5e18)))
    .to.emit(nftPhaseTwo, 'PriceUpdated')
    .withArgs(deployer.address,1, String(5e18));
  })

  it("Should airdrop token", async function() {
    await expect(nftPhaseTwo.airdropToken(1, deployer.address))
    .to.emit(nftPhaseTwo, 'AirdropToken')
    .withArgs(deployer.address,deployer.address, 1);
  })

  it("Should set min price", async function() {
    await expect(nftPhaseTwo.setMinPrice(1))
    .to.emit(nftPhaseTwo, 'MinPriceUpdated')
    .withArgs(deployer.address,1);
  })

  it("Should set baseURI", async function() {
    await expect(nftPhaseTwo.setBaseURI("test"))
    .to.emit(nftPhaseTwo, 'BaseURIUpdated')
    .withArgs(deployer.address, "test");
  })

  it("Should flip whitelisted status", async function() {
    await expect(nftPhaseTwo.flipPausedStatus())
    .to.emit(nftPhaseTwo, 'StatusUpdated')
    .withArgs(deployer.address, true);
  })

  it("Should set whitelist period", async function() {
    await expect(nftPhaseTwo.setWhitelistPeriod(1,1))
    .to.emit(nftPhaseTwo, 'WhitelistUpdated')
    .withArgs(deployer.address, 1);
  })

  it("Should set whitelist base delta", async function() {
    await expect(nftPhaseTwo.setWhitelistBaseDelta(1))
    .to.emit(nftPhaseTwo, 'WhitelistBaseDeltaUpdated')
    .withArgs(deployer.address);
  })

  it("Should withdraw coins", async function() {
    // get nft price 
    const price = await nftPhaseTwo.getTokenPrice(15, deployer.address);
    // buy nfts 
    const buyTx = await nftPhaseTwo.buyToken(15,{value: price.toString()})
    await buyTx.wait()

    const blockNumber = await ethers.provider.getBlockNumber()
    const block = await ethers.provider.getBlock(blockNumber)
    const timestamp = block.timestamp;

    await expect(nftPhaseTwo.withdraw())
    .to.emit(nftPhaseTwo, 'WithdrawFunds')
    .withArgs(deployer.address,price.toString(), timestamp + 1, "0x0000000000000000000000000000000000000000");
  })

  it("Should return owned token", async function() {
    // get nft price 
    const price = await nftPhaseTwo.getTokenPrice(15, deployer.address);
    // buy nfts 
    const buyTx = await nftPhaseTwo.buyToken(15,{value: price.toString()})
    await buyTx.wait()

    const owned = await nftPhaseTwo.Owned(deployer.address)

    expect(owned[0].toNumber()).to.equal(15);
  })

  it("Should return token uri", async function() {
    // get nft price 
    const price = await nftPhaseTwo.getTokenPrice(15, deployer.address);
    // buy nfts 
    const buyTx = await nftPhaseTwo.buyToken(15,{value: price.toString()})
    await buyTx.wait()

    const bsUrl = await nftPhaseTwo.setBaseURI("http://localhost/")
    await bsUrl.wait()

    const uri = await nftPhaseTwo.tokenURI(15)

    expect(uri).to.equal("http://localhost/15");
  })

  it("Should fail set token price", async function() {
    await expect(nftPhaseTwo.setTokenPrice(5000, String(5e18))).to.be.reverted;
  })

  it("Should fail set token price", async function() {
    await expect(nftPhaseTwo.connect(buyer).setTokenPrice(5, String(5e18))).to.be.reverted;
  })

  it("Should fail set min price", async function() {
    await expect(nftPhaseTwo.connect(buyer).setMinPrice(5)).to.be.reverted;
  })

  it("Should fail withdraw", async function() {
    await expect(nftPhaseTwo.withdraw()).to.be.reverted;
  })

  it("Should return empty array", async function() {
    const owned = await nftPhaseTwo.Owned(deployer.address)
    expect(owned.length).to.equal(0);
  })

  it("Should fail set base uri", async function() {
    await expect(nftPhaseTwo.connect(buyer).setBaseURI("test")).to.be.reverted;
  })

  it("Should fail flip paused status", async function() {
    await expect(nftPhaseTwo.connect(buyer).flipPausedStatus()).to.be.reverted;
  })

  it("Should fail set whitelist period", async function() {
    await expect(nftPhaseTwo.connect(buyer).setWhitelistPeriod(0,1)).to.be.reverted;
  })

  it("Should fail set whitelist base delta", async function() {
    await expect(nftPhaseTwo.connect(buyer).setWhitelistBaseDelta(1)).to.be.reverted;
  })

  it("Should fail withdraw", async function() {
    await expect(nftPhaseTwo.connect(buyer).withdraw()).to.be.reverted;
  })
  it("Should fail airdrop token", async function() {
    await expect(nftPhaseTwo.connect(buyer).airdropToken(1, deployer.address)).to.be.reverted;
  })

  it("Should fail airdrop token", async function() {
    await expect(nftPhaseTwo.airdropToken(15, "0x0000000000000000000000000000000000000000")).to.be.reverted;
  })

  it("Should fail set min price", async function() {
    await expect(nftPhaseTwo.setMinPrice(0)).to.be.reverted;
  })

  it("Should fail set token price", async function() {
    await expect(nftPhaseTwo.setTokenPrice(1, 0)).to.be.reverted;
  })

  it("Should return total supply after full mint", async function () {
   let tokenId = 0;
   while(true) {
    try{
      // get nft price 
      const price = await nftPhaseTwo.getTokenPrice(tokenId, deployer.address);

      // buy nfts 
      const buyTx = await nftPhaseTwo.buyToken(tokenId,{value: price.toString()})
      await buyTx.wait()
      tokenId++
    }
    catch {
      break;
    }
   }
    // get total supply
    let totalSupply = await nftPhaseTwo.totalSupply()

    expect(totalSupply.toNumber()).to.equal(61);
  });
});
