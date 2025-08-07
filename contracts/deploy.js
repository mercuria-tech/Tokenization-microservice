const { ethers } = require("hardhat");

async function main() {
  // Deploy ERC20Token
  const ERC20 = await ethers.getContractFactory("AssetToken");
  const erc20 = await ERC20.deploy("AssetToken", "ATK");
  await erc20.deployed();
  console.log("ERC20Token deployed to:", erc20.address);

  // Deploy ERC721Token
  const ERC721 = await ethers.getContractFactory("AssetNFT");
  const erc721 = await ERC721.deploy("AssetNFT", "ANFT");
  await erc721.deployed();
  console.log("ERC721Token deployed to:", erc721.address);

  // Deploy ERC1400Token
  const ERC1400 = await ethers.getContractFactory("AssetSecurityToken");
  const erc1400 = await ERC1400.deploy("AssetSecurityToken", "ASTK");
  await erc1400.deployed();
  console.log("ERC1400Token deployed to:", erc1400.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
