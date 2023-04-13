const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Ebay Smart Contract", function () {
  let Ebay;
  let ebay;
  let seller;
  let buyr1;
  let buyr2;
  let buyrs;

  // const name =  "auction";
  // const description =  "Selling item1";
  // const min =  10;
  const auction = {
    name: "auction1",
    description: "Selling item1",
    min: 10,
    bestPrice: 100,
  };

  beforeEach(async function () {
    Ebay = await ethers.getContractFactory("Ebay");
    [seller, buyr1, buyr2, ...buyrs] = await ethers.getSigners();
    ebay = await Ebay.deploy();
  });

  describe("Testing createAuction Function", function () {
    it("should create an auction", async function () {
      let auctions;
      await ebay.createAuction(auction.name, auction.description, auction.min);
      auctions = await ebay.getAuctions();

      // Check that the auction's properties match the provided parameters
      expect(auctions).to.have.lengthOf(1);
      expect(auctions[0].name).to.equal(auction.name);
      expect(auctions[0].description).to.equal(auction.description);
      expect(auctions[0].min).to.equal(auction.min);
      //console.log(typeof auctions[0].min);
    });

    it("Minimum value of auction should be greater than 0", async () => {
      const _name = "Test Auction";
      const _description = "Test Description";
      const _min = 0;
      await expect(
        ebay.createAuction(_name, _description, _min)
      ).to.be.revertedWith("minimum must be greater than 0");
    });

    it("should not create an offer if price is too low", async () => {
      await ebay.createAuction(auction.name, auction.description, auction.min);
      await expect(
        ebay.connect(buyr1).createOffer(1, { value: auction.min - 1 })
      ).to.be.revertedWith("msg.value must be greater than the minimum and the best offer");
    });


      it("should not allow selling the product for less than the best offer price", async () => {
        // Create an auction with a minimum price of 10
        await ebay.createAuction(auction.name, auction.description, auction.min);
    
        // Make two offers, one for 15 and another for 20
        await ebay.connect(buyr1).createOffer(1, { value: 15 });
        await ebay.connect(buyr2).createOffer(1, { value: 20 });
    
        // Try to sell the product for 10 (less than the best offer price)
        await expect(ebay.connect(buyr1).createOffer(1, { value: 15 })).to.be.revertedWith("msg.value must be greater than the minimum and the best offer");
      });


      it("should not create an offer if price is not greater than the best offer", async () => {
        await ebay.createAuction(auction.name, auction.description, auction.min);
        const auctionId = 1;
        const offerPrice1 = 20;
        const offerPrice2 = 15;
        await ebay.connect(buyr1).createOffer(auctionId, {value: offerPrice1});
        await expect(
          ebay.connect(buyr2).createOffer(auctionId, {value: offerPrice2})
        ).to.be.revertedWith("msg.value must be greater than the minimum and the best offer");
      });

      it("should create an offer", async () => {
        await ebay.createAuction(auction.name, auction.description, auction.min);
        await ebay.connect(buyr1).createOffer(1, { value: auction.min });
      
        const userOffers = await ebay.getUserOffers(buyr1.address);
        expect(userOffers.length).to.equal(1);
        expect(parseInt(userOffers[0].id)).to.equal(1);
        expect(userOffers[0].buyer).to.equal(buyr1.address);
        expect(parseInt(userOffers[0].price)).to.equal(auction.min);
    });

    it("should not create an offer if auction does not exist", async () => {
        const auctionId = 1;
        const invalidAuctionId = 2;
        await ebay.createAuction(auction.name, auction.description, auction.min);
        await expect(ebay.connect(buyr1).createOffer(invalidAuctionId, { value: auction.min + 10,})).to.be.revertedWith("Auction does not exist");
    });


    it("should transfer the best offer to the seller", async function () {
        await ebay.connect(buyr1).createOffer(1, { value: auction.bestPrice });
        const balanceBefore = await seller.getBalance();
        await ebay.transaction(1);
        const balanceAfter = await seller.getBalance();
      
        expect(balanceAfter).to.equal(balanceBefore.add(auction.bestPrice));
    });

    it("should transfer the highest bid to the seller upon closing an auction", async () => {
        await ebay.createAuction(auction.name, auction.description, auction.min);
        await ebay.connect(buyr1).createOffer(1, { value: 15 });
        await ebay.connect(buyr2).createOffer(1, { value: 20 });
        const balanceBefore = await seller.getBalance();
        await ebay.transaction(1);
        const balanceAfter = await seller.getBalance();
        expect(balanceAfter).to.be.greaterThan(balanceBefore);
      });

    it("should transfer funds back to buyers if not the best offer", async function () {
        await ebay.connect(buyr1).createOffer(1, { value: auction.bestPrice });
        await ebay.connect(buyr2).createOffer(1, { value: auction.bestPrice + 10 });
        const balanceBeforeBuyr1 = await buyr1.getBalance();
        await ebay.transaction(1);
        const balanceAfterBuyr1 = await buyr1.getBalance();
        const balanceBeforeBuyr2 = await buyr2.getBalance();
        await ebay.transaction(1);
        const balanceAfterBuyr2 = await buyr2.getBalance();
      
        expect(balanceAfterBuyr1).to.equal(balanceBeforeBuyr1);
        expect(balanceAfterBuyr2).to.equal(balanceBeforeBuyr2.add(auction.bestPrice + 10));
      });



      
      
      
  });
});
