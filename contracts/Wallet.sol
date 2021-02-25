// SPDX-License-Identifier: MIT
pragma solidity 0.7.5;
pragma abicoder v2;


contract Wallet {
    address[] public owners;
    uint256 public transferThreshold;
    uint256 public balance;

    struct Transfer {
        uint256 amount;
        address payable recipient;
        uint256 approvals;
        bool sent;
        uint256 id;
    }

    Transfer[] transferRequests;

    mapping(address => mapping(uint256 => bool)) approvals;
    mapping(address => bool) owner;

    modifier onlyOwners() {
        require(owner[msg.sender] == true, "You are not an owner");
        _;
    }

    constructor(address[] memory _owners, uint256 _transferThreshold) 
    {
        transferThreshold = _transferThreshold;

        for(uint256 i = 0; i < _owners.length; i++) {
            owners.push(_owners[i]);
            owner[_owners[i]] = true;
        }

    }

    function deposit() public payable {
        balance += msg.value;
    }

    function createTransfer(uint256 _amount, address payable _recipient) public onlyOwners {
        require(_amount <= balance, "Insufficient funds.");
        uint256 newId = transferRequests.length;
        Transfer memory newTransfer = Transfer(_amount, _recipient, 0, false, newId);
        transferRequests.push(newTransfer);
        approvals[msg.sender][newId] = true;
        transferRequests[newId].approvals += 1;
    }

    function approve(uint256 _id) public onlyOwners returns(string memory status) {
        require(transferRequests[_id].sent == false, "Transfer already approved for sending");
        require(approvals[msg.sender][_id] == false, "Transfer already approved by this address");
        approvals[msg.sender][_id] = true;
        transferRequests[_id].approvals++;
        
        if(transferRequests[_id].approvals == transferThreshold) {
            transferRequests[_id].recipient.transfer(transferRequests[_id].amount);
            balance -= transferRequests[_id].amount;
            transferRequests[_id].sent = true;
            return "Approved and transferred.";
        }

        else {
            return "Approved, not yet transferred.";
        }
    }

    function getTransferRequests() public view returns(Transfer[] memory) {
        return transferRequests;
    }
}