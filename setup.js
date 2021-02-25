const BigNumber = require("bignumber.js");
const tenTo18 = new BigNumber(1000000000000000000);

require("chai/register-expect");

const errCheck = async promise => {
    let msg = "No error";

    await promise
    .catch(e => {
        msg = e.message;
    });

    return msg.includes("revert")
        || msg.includes("Exception");
}

module.exports = [ BigNumber, tenTo18, errCheck ];
