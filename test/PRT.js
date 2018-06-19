const PRT = artifacts.require("PRT");

const NAME = "Pioneer Reputation Token";
const SYMBOL = "PRT";
const DECIMALS = 18;
const INITIAL_SUPPLY = 230000;
const TOTAL_SUPPLY_MCOIN = INITIAL_SUPPLY * 10 ** DECIMALS;

async function validateContractState(contract, { name, symbol, decimals, totalSupply, balances, allowed }) {
  const _name = await contract.name.call();
  assert.equal(_name, name === undefined ? NAME : name);
  const _symbol = await contract.symbol.call();
  assert.equal(_symbol, symbol === undefined ? SYMBOL : symbol);
  const _decimals = await contract.decimals.call();
  assert.equal(_decimals, decimals === undefined ? DECIMALS : decimals);
  const _totalSupply = await contract.totalSupply.call();
  assert.equal(_totalSupply, totalSupply === undefined ? TOTAL_SUPPLY_MCOIN : totalSupply);
  balances = balances === undefined ? [] : balances;
  let address;
  let value;
  for ({ address, value } of balances) {
    const _value = await contract.balanceOf(address);
    assert.equal(_value, value);
  }
  allowed = allowed === undefined ? [] : allowed;
  let owner;
  let allowances;
  for ({ owner, allowances } of allowed) {
    let spender;
    let ammount;
    for ({ spender, ammount } of allowances) {
      const _ammount = await contract.allowance(owner, spender);
      assert.equal(_ammount, ammount);
    }
  }
}

function getEvents(result, eventName) {
  const { logs } = result;
  return logs === undefined ? [] : logs.filter(e => e.event === eventName);
}

function validateEvents(events, expected) {
  expected = expected === undefined ? [] : expected;
  assert.equal(events.length, expected.length);
  expected.forEach((target, index) => {
    const event = events[index];
    Object.keys(target).forEach(key => {
      assert.deepEqual(event[key], target[key]);
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
      const otherAccount = web3.eth.accounts[1];
      const transactionAmmount = 1000;

      const result = await prt.transfer(otherAccount, transactionAmmount);

      assert.equal(result.receipt.gasUsed, 51063);
      await validateContractState(prt, {
        balances: [
          {
            address: web3.eth.coinbase,
            value: TOTAL_SUPPLY_MCOIN - transactionAmmount
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
            value: {
              c: [transactionAmmount],
              e: 3,
              s: 1
            }
          }
        }
      ]);
    });
    it("test_zero_transfer", async () => {
      const otherAccount = web3.eth.accounts[1];
      const transactionAmmount = 0;

      const result = await prt.transfer(otherAccount, transactionAmmount);

      assert.equal(result.receipt.gasUsed, 35935);
      await validateContractState(prt, {
        balances: [
          {
            address: web3.eth.coinbase,
            value: TOTAL_SUPPLY_MCOIN - transactionAmmount
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
            value: {
              c: [transactionAmmount],
              e: 0,
              s: 1
            }
          }
        }
      ]);
    });
    it("test_invalid_transfer", async () => {
      const otherAccount = web3.eth.accounts[1];
      const transactionAmmount = TOTAL_SUPPLY_MCOIN + TOTAL_SUPPLY_MCOIN;

      const result = await checkError(prt.transfer(otherAccount, transactionAmmount));

      await validateContractState(prt, {
        balances: [
          { address: web3.eth.coinbase, value: TOTAL_SUPPLY_MCOIN - transactionAmmount },
          { address: otherAccount, value: 0 }
        ]
      });

      validateEvents(getEvents(result, "Transfer"));
    });
    it("test_approve", async () => {
      const otherAccount = web3.eth.accounts[1];
      const ammount = 10;
      const result = await prt.approve(otherAccount, ammount);

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
      const otherAccount = web3.eth.accounts[1];
      const ammount = 10;
      let result = await prt.approve(otherAccount, ammount);

      result = await checkError(prt.approve(otherAccount, ammount));

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
  });
});
