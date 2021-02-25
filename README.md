# Multi-Sig Ethereum Wallet

This basic wallet grants ownership of a multi-sig wallet to a determined list of addresses. These owner addresses can propose transfer requests to any other address to their co-owners, and the transfer only sends when a determined number of the owners approves the transfer. Anyone can send Ether to the wallet.


## Installation

To install dependencies, run:

```bash
npm install
```

## Compilation and testing

To compile and test using Truffle, run:

```bash
truffle compile --all
truffle test
```


## License

[MIT](https://choosealicense.com/licenses/mit/)