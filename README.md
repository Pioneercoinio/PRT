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

### Compiling the contract

First compile the contract with soc

```
solc --combined-json abi,bin,interface PRT.sol > PRT.json
```

### Deploy

Copy the bin for PRT.sol from the output into the ```CONTRACT BYTE CODE``` section
of the Mist Deploy Contract screen.

Select ```DEPLOY```

Enter your password for the deploying account

Once the transaction is cleared the contract address can be seen in the transaction
history of the deploying account.


## Deployments

Details about deployments of this contract can be found in [deployments](deployments)

### Mainnet

PRT is deployed on the Ethereum Main network. Details of the deployment can be found [here](deployments/PRT_main.json)
