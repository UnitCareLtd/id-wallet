import assertRevert from './helpers/assertRevert';
import expectThrow from './helpers/expectThrow';
import web3utils from 'web3-utils';
const UnitCareIdentityToken = artifacts.require("UnitCareIdentityToken");

contract("UnitCareIdentityToken", (accounts) => {
    let UnitCareIdentityToken;
    const identityProvider = "0xf863AF8D7043924512aEaa2Da83aaC1E14C96B0D";
    const confidenceThreshold = 3435973836;

    const oracleNonce = "c99f819716ef4a46a8b";
    const confidenceResult = 4292046717;
    const user = "0xd4Ea6fbd184b2056536f2A741257A5aC047Ef67C";
    const r = "0x6153ec38c4d95be2dcda02b77f0522aab654cf5b42f02bdcc018ff55ab0c83c8";
    const s = "0x0b1be6f514bb269fbbcb3ebbc35cd480467b62be8bab18552321388826430692";
    const v = 27;

    beforeEach(async() => {
        UnitCareIdentityToken = await UnitCareIdentityToken.new(identityProvider, confidenceThreshold);
    });

    it("should be connected to the correct user account", async function() {
        assert.equal(accounts[0], user, "you must use 'candy maple cake sugar pudding cream honey rich smooth crumble sweet treat' as your mnemonic seed");
    });

    it("should have the right Identity Provider", async function() {
        let contractProvider = await UnitCareIdentityToken.identityProvider.call();
        assert.equal(contractProvider, identityProvider, "identity provider didn't get set on deployment");
    });

    it("Should return true upon successful registration", async function() {
        let success = await UnitCareIdentityToken.register.call(oracleNonce, confidenceResult, user, r, s, v)
        assert.equal(success, true, "Registration returned unsuccessful");
    });

    it("Should not allow the same user to register more than once", async function() {
        await UnitCareIdentityToken.register(oracleNonce, confidenceResult, user, r, s, v);
        await assertRevert(UnitCareIdentityToken.register(oracleNonce, confidenceResult, user, r, s, v));
    });

    it("Successful registration should be saved in registrations mapping", async function() {
        await UnitCareIdentityToken.register(oracleNonce, confidenceResult, user, r, s, v)
        let data = await UnitCareIdentityToken.registrations.call(user);
        assert.equal(data[2], oracleNonce, "Registration struct not saved properly");
    });

    it("Should return false upon failure to retrieve Registration struct", async function() {
        await UnitCareIdentityToken.register(oracleNonce, confidenceResult, user, r, s, v)
        let data = await UnitCareIdentityToken.registrations.call(accounts[3]);
        assert.equal(data[2], '', "Unregistered address associated with Registration struct");
    });

    it("Should return false if verification is attempted and user is not registered", async function() {
        await UnitCareIdentityToken.register(oracleNonce, confidenceResult, user, r, s, v);
        expectThrow(UnitCareIdentityToken.verify.call(oracleNonce, confidenceResult, accounts[3], r, s, v));
    });

    it("Should return true upon successful verification", async function() {
        await UnitCareIdentityToken.register(oracleNonce, confidenceResult, user, r, s, v)
        let success = await UnitCareIdentityToken.verify.call(oracleNonce, confidenceResult, user, r, s, v);
        assert.equal(success, true, "Verification attempt unsuccessful");
    });

    it("Should return false upon failed verification based on confidence result too low", async function() {
        let oracleNonceFail = "e4cf4aa1de234672b23";
        let confidenceResultFail = 793416696;
        let rFail = "0x5eef741c1a684e46e44f01481828834c98f2e2e42663dc41f404991a7790d171";
        let sFail = "0x4dc9104454b0800623043fa60771a67241e2ba62c39b87f7abddbd2f574d98a1";
        let vFail = 28;

        await UnitCareIdentityToken.register(oracleNonce, confidenceResult, user, r, s, v);
        let success = await UnitCareIdentityToken.verify.call(oracleNonceFail, confidenceResultFail, user, rFail, sFail, vFail);
        assert.equal(success, false, "verification was successful, when confidence was too low");
    });

    it("Should throw if message hash has been used in a previous verification", async function() {
        await UnitCareIdentityToken.register(oracleNonce, confidenceResult, user, r, s, v);
        await UnitCareIdentityToken.verify(oracleNonce, confidenceResult, user, r, s, v);
        expectThrow(UnitCareIdentityToken.verify(oracleNonce, confidenceResult, user, r, s, v));
    });

    it("Should return false upon failed verification", async function() {
        await UnitCareIdentityToken.register(oracleNonce, confidenceResult, user, r, s, v)
        let success = await UnitCareIdentityToken.verify.call(oracleNonce, confidenceResult, user, r, s, v);
        assert.equal(success, true, "Verification attempt unsuccessful");
    });

    it("Should return true upon retrieval of Verification struct", async function() {
        await UnitCareIdentityToken.register(oracleNonce, confidenceResult, user, r, s, v);
        await UnitCareIdentityToken.verify(oracleNonce, confidenceResult, user, r, s, v);
        let count = await UnitCareIdentityToken.verificationCounts.call(user);
        let verificationHash = web3utils.soliditySha3(user, count);
        let data = await UnitCareIdentityToken.verifications.call(verificationHash);
        assert.equal(data[0], oracleNonce, "Verification struct not saved properly");
    });

    it("should successfully add new tokens to recipient account after successful verifyAndTransfer", async function() {
        await UnitCareIdentityToken.register(oracleNonce, confidenceResult, user, r, s, v);
        let startingBalance = await UnitCareIdentityToken.balanceOf.call(accounts[1]);
        assert.equal(startingBalance, 0, "account 1 should not have a starting balance");

        let amount = 15;
        await UnitCareIdentityToken.verifyAndTransfer(oracleNonce, confidenceResult, user, r, s, v, accounts[1], amount);
        let endingBalance = await UnitCareIdentityToken.balanceOf.call(accounts[1]);
        assert.equal(endingBalance, amount, "account 1 should have a final balance");
    });

    it("should have account 0 balance equal 'totalSupply'", async function() {
        let balance = await UnitCareIdentityToken.balanceOf.call(user);
        let totalSupply = await UnitCareIdentityToken.totalSupply.call();
        assert.equal(balance.toString(), totalSupply.toString(), "account 0 balance should be equal to total supply");
    });

    it("should successfully subtract tokens from sender after successful verifyAndTransfer", async function() {
        let amount = 15;

        await UnitCareIdentityToken.register(oracleNonce, confidenceResult, user, r, s, v);
        let startingBalance = await UnitCareIdentityToken.balanceOf.call(user);
        assert.notEqual(startingBalance, 0, "account 1 should have a starting balance");

        await UnitCareIdentityToken.verifyAndTransfer(oracleNonce, confidenceResult, user, r, s, v, accounts[1], amount);
        let endingBalance = await UnitCareIdentityToken.balanceOf.call(user);
        assert(endingBalance < startingBalance, "account 1 should have a final balance");
    });

    it("should throw if invalid signature values are sent to contract", async function() {
        let rFail = "0x5eef741c1a684e46e44f01481828834c98f2e2e42663dc41f404991a7790d171";
        expectThrow(UnitCareIdentityToken.register.call(oracleNonce, confidenceResult, user, rFail, s, v));
    });

    it("should update identity provider if called by owner", async function() {
        let newProvider = "0xe128d7e2d6b4098e98637903c3d0396afd56f016";
        await UnitCareIdentityToken.updateIdentityProvider(newProvider);
        let updated = await UnitCareIdentityToken.identityProvider.call();
        assert.equal(updated, newProvider, "Provider not updated successfully");
    });

    it("should throw if identity provider is updated by a user who is not owner", async function() {
        let newProvider = "0xe128d7e2d6b4098e98637903c3d0396afd56f016";
        expectThrow(UnitCareIdentityToken.updateIdentityProvider(newProvider, { from: accounts[2] }));
    });

    it("should update confidenceThreshold if called by owner", async function() {
        let newThreshold = 500;
        await UnitCareIdentityToken.updateConfidenceThreshold(newThreshold);
        let updated = await UnitCareIdentityToken.confidenceThreshold.call();
        assert.equal(updated, newThreshold, "Provider not updated successfully");
    });

    it("should throw if confidenceThreshold is updated by a user who is not owner", async function() {
        let newThreshold = 500;
        expectThrow(UnitCareIdentityToken.updateConfidenceThreshold(newThreshold, { from: accounts[2] }));
    });

    it("should die when owner kills it", async function() {
        const { address } = UnitCareIdentityToken;
        await UnitCareIdentityToken.kill();
        assert.isUndefined(UnitCareIdentityToken(address));
    });

    it("should revert when someone other than owner tries to kill it", async function() {
        const notOwner = accounts[1];
        await assertRevert(UnitCareIdentityToken.kill({ from: notOwner }));
    });
});