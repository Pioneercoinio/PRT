/* globals artifacts */

import { getEvents, validateEvents, checkError } from "./test_helpers";

const Owned = artifacts.require("Owned");

contract("Owned", addresses => {
  let owned;

  beforeEach(async () => {
    owned = await Owned.new();
  });

  describe("when initialized", () => {
    it("initial sate", async () => {
      const owner = await owned.owner.call();
      assert.equal(owner, web3.eth.coinbase);
    });
    it("valid_transferOwnership", async () => {
      const otherAccount = addresses[1];

      const result = await owned.transferOwnership(otherAccount);

      assert.equal(result.receipt.gasUsed, 30433);

      validateEvents(getEvents(result, "OwnershipTransferred"), [
        {
          event: "OwnershipTransferred",
          args: {
            previousOwner: web3.eth.coinbase,
            newOwner: otherAccount
          }
        }
      ]);
    });
    it("invalid_transferOwnership", async () => {
      const otherAccount = addresses[1];

      await owned.transferOwnership(otherAccount);

      const result = await checkError(owned.transferOwnership(web3.eth.coinbase));

      validateEvents(getEvents(result, "OwnershipTransferred"));
    });
  });
});
