/* globals artifacts */

import { toBN } from "web3-utils";

const PRT = artifacts.require("PRT");

const NAME = "Pioneer Reputation Token";
const SYMBOL = "PRT";
const DECIMALS = 18;
const INITIAL_SUPPLY = 230000;
const TOTAL_SUPPLY_MCOIN = toBN(INITIAL_SUPPLY).mul(toBN(10 ** DECIMALS));

async function validateContractState(contract, { name, symbol, decimals, totalSupply, balances, allowed }) {
  const actualName = await contract.name.call();
  assert.equal(actualName, name === undefined ? NAME : name);
  const actualSymbol = await contract.symbol.call();
  assert.equal(actualSymbol, symbol === undefined ? SYMBOL : symbol);
  const actualDecimals = await contract.decimals.call();
  assert.equal(actualDecimals, decimals === undefined ? DECIMALS : decimals);
  const actualTotalSupply = await contract.totalSupply.call();
  const expectedSupply = totalSupply === undefined ? TOTAL_SUPPLY_MCOIN : totalSupply;
  assert.equal(toBN(actualTotalSupply).toString(), expectedSupply.toString());
  const expectedBalances = balances === undefined ? [] : balances;
  let address;
  let value;
  // eslint-disable-next-line no-restricted-syntax
  for ({ address, value } of expectedBalances) {
    // eslint-disable-next-line no-await-in-loop
    const actualValue = await contract.balanceOf(address);
    assert.equal(toBN(actualValue).toString(), value.toString());
  }
  const expectedAllowed = allowed === undefined ? [] : allowed;
  let owner;
  let allowances;
  // eslint-disable-next-line no-restricted-syntax
  for ({ owner, allowances } of expectedAllowed) {
    let spender;
    let ammount;
    // eslint-disable-next-line no-restricted-syntax
    for ({ spender, ammount } of allowances) {
      // eslint-disable-next-line no-await-in-loop
      const actualAmmount = await contract.allowance(owner, spender);
      assert.equal(toBN(actualAmmount).toString(), ammount.toString());
    }
  }
}

function getEvents(result, eventName) {
  const { logs } = result;
  return logs === undefined ? [] : logs.filter(e => e.event === eventName);
}

function softEqual(actual, expected) {
  assert.equal(typeof actual, typeof expected);
}

function validateEvents(events, pExpected) {
  const expected = pExpected === undefined ? [] : pExpected;
  assert.equal(events.length, expected.length);
  expected.forEach((target, index) => {
    const event = events[index];
    Object.keys(target).forEach(key => {
      softEqual(event[key], target[key]);
    });
  });
}

// eslint-disable-next-line no-unused-vars
async function checkError(promise) {
  let result;
  try {
    result = await promise;
  } catch (err) {
    result = err;
  }
  // Check the receipt `status` to ensure transaction failed.
  assert.equal(result.receipt.status, 0x00);

  return result;
}

contract("PRT", addresses => {
  let prt;

  beforeEach(async () => {
    prt = await PRT.new();
  });

  describe("when initialized", () => {
    it("initial sate", async () => {
      await validateContractState(prt, {
        balances: [{ address: web3.eth.coinbase, value: TOTAL_SUPPLY_MCOIN }]
      });
    });
    it("valid_transfer", async () => {
      const otherAccount = addresses[1];
      const transactionAmmount = toBN(1000);

      const result = await prt.transfer(otherAccount, transactionAmmount.toString());

      assert.equal(result.receipt.gasUsed, 51063);
      await validateContractState(prt, {
        balances: [
          {
            address: web3.eth.coinbase,
            value: TOTAL_SUPPLY_MCOIN.sub(transactionAmmount)
          },
          { address: otherAccount, value: transactionAmmount }
        ]
      });

      validateEvents(getEvents(result, "Transfer"), [
        {
          event: "Transfer",
          args: {
            from: web3.eth.coinbase,
            to: otherAccount,
            value: transactionAmmount
          }
        }
      ]);
    });
    it("test_zero_transfer", async () => {
      const otherAccount = addresses[1];
      const transactionAmmount = toBN(0);

      const result = await prt.transfer(otherAccount, transactionAmmount.toString());

      assert.equal(result.receipt.gasUsed, 35935);
      await validateContractState(prt, {
        balances: [
          {
            address: web3.eth.coinbase,
            value: TOTAL_SUPPLY_MCOIN.sub(transactionAmmount)
          },
          { address: otherAccount, value: transactionAmmount }
        ]
      });

      validateEvents(getEvents(result, "Transfer"), [
        {
          event: "Transfer",
          args: {
            from: web3.eth.coinbase,
            to: otherAccount,
            value: transactionAmmount
          }
        }
      ]);
    });
    it("test_invalid_transfer", async () => {
      const otherAccount = addresses[1];
      const transactionAmmount = TOTAL_SUPPLY_MCOIN + 1;

      const result = await checkError(prt.transfer(otherAccount, transactionAmmount.toString()));

      await validateContractState(prt, {
        balances: [{ address: web3.eth.coinbase, value: TOTAL_SUPPLY_MCOIN }, { address: otherAccount, value: 0 }]
      });

      validateEvents(getEvents(result, "Transfer"));
    });
    it("test_approve", async () => {
      const otherAccount = addresses[1];
      const ammount = toBN(10);
      const result = await prt.approve(otherAccount, ammount.toString());

      assert.equal(result.receipt.gasUsed, 45698);
      await validateContractState(prt, {
        allowed: [
          {
            owner: web3.eth.coinbase,
            allowances: [{ spender: otherAccount, ammount }]
          }
        ]
      });

      validateEvents(getEvents(result, "Approval"), [
        {
          event: "Approval",
          args: {
            owner: web3.eth.coinbase,
            spender: otherAccount,
            value: ammount
          }
        }
      ]);
    });
    it("test_approve_non_zero", async () => {
      const otherAccount = addresses[1];
      const ammount = toBN(10);
      let result = await prt.approve(otherAccount, ammount.toString());

      result = await checkError(prt.approve(otherAccount, ammount.toString()));

      await validateContractState(prt, {
        allowed: [
          {
            owner: web3.eth.coinbase,
            allowances: [{ spender: otherAccount, ammount }]
          }
        ]
      });

      validateEvents(getEvents(result, "Approval"));
    });
    it("test_approve_zero_first", async () => {
      const otherAccount = addresses[1];
      const ammount = toBN(10);
      let result = await prt.approve(otherAccount, ammount.toString());

      result = await prt.approve(otherAccount, 0);

      result = await prt.approve(otherAccount, ammount.toString());

      validateContractState(prt, {
        allowed: [
          {
            owner: web3.eth.coinbase,
            allowances: [{ spender: otherAccount, ammount }]
          }
        ]
      });

      validateEvents(getEvents(result, "Approval"), [
        {
          event: "Approval",
          args: {
            owner: web3.eth.coinbase,
            spender: otherAccount,
            value: ammount
          }
        }
      ]);
    });
    it("test_transferFrom_not_allowed", async () => {
      const otherAccount = addresses[1];
      const destAccount = addresses[2];
      const ammount = 10;
      await checkError(prt.transferFrom(otherAccount, destAccount, ammount));
    });
  });
});
