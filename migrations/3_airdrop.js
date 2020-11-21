const UnitCareIdentityToken = artifacts.require("./contracts/UnitCareIdentityToken.sol");
const airdrop = require("../airdrop/airdrop.js");

module.exports = function(deployer, network, accounts) {
    deployer.then(() => UnitCareIdentityToken.deployed())
        .then((instance) => airdrop.prepareTransfers(instance, "./airdrop/airdrop.csv"))
        .then(({ instance, transfers }) => airdrop.checkBalances(instance, transfers))
        .then(({ instance, transfers }) => airdrop.filterAccounts(instance, transfers))
        .then(({ instance, transfers }) => airdrop.makeTransactions(instance, accounts[0], transfers))
        .catch((error) => console.log(error));
};