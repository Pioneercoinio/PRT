/* globals artifacts */

import { toBN } from "web3-utils";
import { defaultValidateContractSate, getEvents, validateEvents, checkError } from "./test_helpers";

const PRT = artifacts.require("PRT");

const DECIMALS = 18;
const INITIAL_SUPPLY = 230000;
const TOTAL_SUPPLY_MCOIN = toBN(INITIAL_SUPPLY).mul(toBN(10 ** DECIMALS));

const validateContractState = defaultValidateContractSate({
  name: "Pioneer Reputation Token",
  symbol: "PRT",
  decimals: DECIMALS,
  totalSupply: TOTAL_SUPPLY_MCOIN,
  colony: 0
});

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

      assert.equal(result.receipt.gasUsed, 51129);
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

      assert.equal(result.receipt.gasUsed, 36001);
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
    it("test_registerColony", async () => {
      const otherAccount = addresses[1];

      const result = await prt.registerColony(otherAccount);

      assert.equal(result.receipt.gasUsed, 71941);

      const colonySupply = TOTAL_SUPPLY_MCOIN.divn(2);

      await validateContractState(prt, {
        colony: otherAccount,
        balances: [{ address: web3.eth.coinbase, value: colonySupply }, { address: otherAccount, value: colonySupply }]
      });

      validateEvents(getEvents(result, "Transfer"), [
        {
          event: "Transfer",
          args: {
            from: web3.eth.coinbase,
            to: otherAccount,
            value: colonySupply
          }
        }
      ]);
    });
    it("test_registerColony_only_once", async () => {
      const otherAccount = addresses[1];

      let result = await prt.registerColony(otherAccount);

      result = await checkError(prt.registerColony(otherAccount));
      validateEvents(getEvents(result, "Transfer"));
    });
    it("test_registerColony_only_owner", async () => {
      const otherAccount = addresses[1];

      await prt.transferOwnership(otherAccount);

      const result = await checkError(prt.registerColony(otherAccount));

      assert.equal(result.receipt.gasUsed, 23442);

      await validateContractState(prt, {
        balances: [{ address: web3.eth.coinbase, value: TOTAL_SUPPLY_MCOIN }, { address: otherAccount, value: toBN(0) }]
      });

      validateEvents(getEvents(result, "Transfer"));
    });
  });
});
