# PRT Solidity Contract

This repo contains the definition of the PRT Ethereum smart contract.

Including [tests](test) to validate that the contract works as expected.

It implements is a [ERC20](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-20.md) token

## Running locally

To build the contract and run the tests:

First install dependencies and set up the python virtualenv environment by running:

```
yarn install
```

Compile the contract and run the test with:

```
npm run test
```

## Deploying the contract

The contract can be deployed to the Ethereum blockchain using the Mist wallet.

It is advisable to first deploy to the test blockchain before committing real ether.

