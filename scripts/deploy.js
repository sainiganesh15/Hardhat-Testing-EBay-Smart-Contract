const { ethers } = require("hardhat");

async function main(){
    // here we are getting the instance of the contract
    //const [deployer] = await ethers.getSigners();  //is used to get an array of signer objects

    const Ebay = await ethers.getContractFactory("Ebay");
    const ebay = await Ebay.deploy();
    console.log("EBay Smart Contract Address:", ebay.address);
}

main().then(()=>process.exit(0))
.catch((error)=>{
    console.error(error);
    process.exit(1);
})