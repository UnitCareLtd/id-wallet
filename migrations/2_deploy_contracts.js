const UnitCareIdentityToken = artifacts.require("./contracts/UnitCareIdentityToken.sol");

module.exports = function(deployer, network, accounts) {
    deployer.deploy(UnitCareIdentityToken, process.env.ORACLE_ADDRESS, process.env.CONFIDENCE_THRESHOLD);
};