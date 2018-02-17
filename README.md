# ERC20Coin Solidity Contract

This repo contains the definision of the ERC20Coin Ethereum smart contract.

Including [tests](tests) to validate that the contract works as expected.

## Running locally

To build the contract and run the tests on OSX:

First install dependencies and set up the python virtualenv environment by running:

```
bootstrap.sh
```

Compile the contract and run the test with:

```
populus compile
py.test tests
```

## Deploying the contract

The contract can be deployed to the Ethereum blockchain using the Mist wallet.

It is advisable to first deploy to the test blockchain before comitting real ether.

