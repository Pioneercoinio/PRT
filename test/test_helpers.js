import { toBN } from "web3-utils";

export function defaultValidateContractSate(defaults){
  return async (contract, { name, symbol, decimals, totalSupply, balances, allowed }) => {
    const actualName = await contract.name.call();
    assert.equal(actualName, name === undefined ? defaults.name : name);
    const actualSymbol = await contract.symbol.call();
    assert.equal(actualSymbol, symbol === undefined ? defaults.symbol : symbol);
    const actualDecimals = await contract.decimals.call();
    assert.equal(actualDecimals, decimals === undefined ? defaults.decimals : decimals);
    const actualTotalSupply = await contract.totalSupply.call();
    const expectedSupply = totalSupply === undefined ? defaults.totalSupply : totalSupply;
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
}

export function getEvents(result, eventName) {
  const { logs } = result;
  return logs === undefined ? [] : logs.filter(e => e.event === eventName);
}

export function softEqual(actual, expected) {
  assert.equal(typeof actual, typeof expected);
}

export function validateEvents(events, pExpected) {
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
export async function checkError(promise) {
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

