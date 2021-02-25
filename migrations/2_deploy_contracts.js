const Wallet = artifacts.require("Wallet");

module.exports = function(deployer, network, accounts) {
    deployer.deploy(Wallet, [accounts[0], accounts[1], accounts[2]], 2);
}