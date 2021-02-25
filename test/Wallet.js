const Wallet = artifacts.require("Wallet");
const [ BigNumber, tenTo18, errCheck ] = require("../setup");

contract("Wallet", async accounts => {
    let deployer = accounts[0];
    let ownerA = accounts[1];
    let ownerB = accounts[2];
    let stranger = accounts[3];
    let transferThreshold = 2;

    it("should deploy the contract", async () => {
        let wallet = await Wallet.deployed();

        expect(typeof wallet == "object").to.be.true;
    });

    it("should assign owners and transfer threshold", async () => {
        let wallet = await Wallet.deployed();
        let assigned1 = await wallet.owners(0);
        let assigned2 = await wallet.owners(1);
        let assigned3 = await wallet.owners(2);
        let assignedThreshold = await wallet.transferThreshold();

        expect(assigned1).to.equal(deployer);
        expect(assigned2).to.equal(ownerA);
        expect(assigned3).to.equal(ownerB);
        expect(assignedThreshold.toNumber()).to.equal(transferThreshold);
    });

    it("should allow anyone to deposit Ether", async () => {
        let wallet = await Wallet.deployed();
        await wallet.deposit({from: deployer, value: tenTo18});
        let bal = new BigNumber(await wallet.balance());

        expect(bal.toNumber()).to.equal(tenTo18.toNumber());

        await wallet.deposit({from: stranger, value: tenTo18});
        bal = new BigNumber(await wallet.balance());

        expect(bal.toNumber()).to.equal((tenTo18.multipliedBy(2)).toNumber());
    });

    it("owner can propose transfer", async () => {
        let wallet = await Wallet.deployed();
        await wallet.deposit({from: deployer, value: tenTo18});

        expect(await errCheck(wallet.createTransfer(50000, stranger, {from: deployer}))).to.be.false;
    });

    it("non-owner cannot propose transfer", async () => {
        let wallet = await Wallet.deployed();
        await wallet.deposit({from: deployer, value: tenTo18});

        expect(await errCheck(wallet.createTransfer(50000, deployer, {from: stranger}))).to.be.true;
    });

    it("returns correct transaction ID on call", async () => {
        let wallet = await Wallet.deployed();
        await wallet.deposit({from: deployer, value: tenTo18});
        await wallet.createTransfer(500, ownerA, {from: deployer});
        await wallet.createTransfer(600, ownerB, {from: ownerA});
        await wallet.createTransfer(700, stranger, {from: ownerB});
        let [ tx1, tx2, tx3 ] = await wallet.getTransferRequests();

        expect(Number(tx1.id)).to.equal(0);
        expect(Number(tx2.id)).to.equal(1);
        expect(Number(tx3.id)).to.equal(2);
    });

    it("should not send if below approval threshold", async () => {
        let wallet = await Wallet.deployed();
        await wallet.deposit({from: deployer, value: tenTo18});
        await wallet.createTransfer(1000000, stranger, {from: deployer});
        let [ , , , , tx4 ] = await wallet.getTransferRequests();

        expect(Number(tx4.approvals)).to.equal(1);
        expect(Boolean(tx4.sent)).to.be.false;
    });

    it("should send when approvals meets threshold", async () => {
        let wallet = await Wallet.deployed();
        await wallet.deposit({from: deployer, value: tenTo18});
        await wallet.createTransfer(1000000, stranger, {from: deployer});
        await wallet.approve(5, {from: ownerA});
        let [ , , , , , tx5 ] = await wallet.getTransferRequests();

        expect(Number(tx5.approvals)).to.equal(2);
        expect(Boolean(tx5.sent)).to.be.true;
    });

    it("balance gets deducted transfer amount", async () => {
        let wallet = await Wallet.deployed();
        await wallet.deposit({from: deployer, value: tenTo18});
        let initialBal = new BigNumber(await wallet.balance());
        await wallet.createTransfer(1000000, stranger, {from: deployer});
        await wallet.approve(6, {from: ownerA});
        let [ , , , , , , tx6 ] = await wallet.getTransferRequests();
        let finalBal = new BigNumber(await wallet.balance());
        let deduction = initialBal.minus(finalBal);

        expect(deduction.toNumber()).to.equal(Number(tx6.amount));
    });

    it("only not yet approved OR sent transaction requests can be approved", async () => {
        let wallet = await Wallet.deployed();
        await wallet.deposit({from: deployer, value: tenTo18});
        await wallet.createTransfer(1000000, stranger, {from: deployer});
        
        expect(await errCheck(wallet.approve(7, {from: deployer}))).to.be.true;

        await wallet.approve(7, {from: ownerB});

        expect(await errCheck(wallet.approve(7, {from: ownerA}))).to.be.true;
    });
});
