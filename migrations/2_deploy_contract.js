/* globals artifacts */
/* eslint-disable no-undef, no-console */

const PRT = artifacts.require("./PRT");

module.exports = (deployer, network) => {
  console.log(`## ${network} network ##`);
  deployer.deploy([PRT]);
};
