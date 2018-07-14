/* globals artifacts */
/* eslint-disable no-undef, no-console */

const Owned = artifacts.require("./Owned");
const PRT = artifacts.require("./PRT");

module.exports = (deployer, network) => {
  console.log(`## ${network} network ##`);
  deployer.deploy([Owned]);
  deployer.deploy([PRT]);
};
