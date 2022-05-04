import {
    mintInitMessage,
    MintingContractPath,
    PairContractPath,
    walletTest1,
    walletTest2,
    walletTest3,
    mint_wallet,
    treasury_wallet,
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
        terraClient.chainID = "localterra";
        let deploymentDetails = readArtifact(terraClient.chainID);
        testinstr(deploymentDetails);
    } catch (error) {
        console.log(error);
    };
    rl.close();
}

const testinstr = async (deploymentDetails) => {
    let qRes = await queryContract(deploymentDetails.proxyContractAddress, {
        get_bonding_details: {
            user_address : marketing_wallet.key.accAddress
        }
    });

    //         withdrawal_amount: "159083","53782"+"105301"

    if (JSON.stringify(qRes) == '[]') {
        console.log(`bonded rewards - empty`);
    } else {
        console.log(`bonded rewards - ${JSON.stringify(qRes)}`);
        let eMsg = {
            reward_claim: {
                receiver: marketing_wallet.key.accAddress,
                withdrawal_amount: qRes[0].bonded_amount,
            }
        };
        console.log(`eMsg = ${JSON.stringify(eMsg)}`);
        let response = await executeContract(marketing_wallet, deploymentDetails.proxyContractAddress, eMsg);
        console.log(`eMsg Response - ${response['txhash']}`);
        // console.log(`eMsg = ${JSON.stringify(response)}`);
    }
}



main()