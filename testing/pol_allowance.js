import dotenv from "dotenv";
dotenv.config();
import {
    mintInitMessage,
    MintingContractPath,
    PairContractPath,
    walletTest1,
    walletTest2,
    walletTest3,
    mint_wallet,
    bonding_wallet,
    liquidity_wallet,
    marketing_wallet,
    terraClient,
    StakingContractPath,
    FactoryContractPath,
    ProxyContractPath
} from './constants.js';
import {
    storeCode,
    queryContract,
    executeContract,
    instantiateContract,
    sendTransaction,
    readArtifact,
    writeArtifact
} from "./utils.js";

import { primeAccountsWithFunds } from "./primeCustomAccounts.js";

import { promisify } from 'util';

import * as readline from 'node:readline';

import * as chai from 'chai';
import { Coin } from '@terra-money/terra.js';
const assert = chai.assert;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
const question = promisify(rl.question).bind(rl);

const main = async () => {
    try {
        let deploymentDetails = readArtifact(terraClient.chainID);
        await increasePOLRewardAllowance(deploymentDetails,liquidity_wallet);
        await increasePOLRewardAllowance(deploymentDetails,bonding_wallet);
    } catch (error) {
        console.log(error);
    }
    rl.close()
}

const increasePOLRewardAllowance = async (deploymentDetails,wallet) => {
    let response = await queryContract(deploymentDetails.furyContractAddress, {
        balance: {address: wallet.key.accAddress}
    });
    let respBalance = Number(response.balance);
    response = await queryContract(deploymentDetails.furyContractAddress, {
        allowance: {owner: wallet.key.accAddress,
                    spender:deploymentDetails.proxyContractAddress}
    });
    let respAllowance = Number(response.allowance);
    console.log(`native : existing balance ${respBalance}, existing allowance ${respAllowance}, increase allowance by ${respBalance - respAllowance}`);
    if (respBalance > respAllowance) {
        let goAheadResponse = await question(`Confirm increase of allowance ? `); 
        if (goAheadResponse === 'Y' || goAheadResponse === 'y') {
            console.log('trying');
        } else {
            return
        }
        let increase_amount = respBalance - respAllowance;
        let execMsg = {increase_allowance: { spender : deploymentDetails.proxyContractAddress, amount: increase_amount.toString()}};
        let execResponse = await executeContract (wallet, deploymentDetails.furyContractAddress, execMsg);
        console.log(`POL increase allowance by ${increase_amount} uFury for proxy in wallet ${wallet.key.accAddress}, txhash ${execResponse['txhash']}`);
    }
}
main()
