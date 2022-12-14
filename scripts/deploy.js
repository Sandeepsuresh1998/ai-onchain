async function main() {
  // Grab the contract factory 
  const AINFT = await ethers.getContractFactory("SyntheticDreams");

  // Start deployment, returning a promise that resolves to a contract object
  const aiNFT = await AINFT.deploy(); // Instance of the contract 
  console.log("Contract deployed to address:", aiNFT.address);
  console.log(aiNFT);
}

main()
 .then(() => process.exit(0))
 .catch(error => {
   console.error(error);
   process.exit(1);
 });