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
    treasury_wallet,
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
    writeArtifact,
    queryBank
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
        console.log(`Wallet to be used marketing_wallet ${marketing_wallet.key.accAddress}`);
        let deploymentDetails = readArtifact(terraClient.chainID);
        await providePairInvestment(deploymentDetails,marketing_wallet);
    } catch (error) {
        console.log(error);
    }
    rl.close()
}
const providePairInvestment = async (deploymentDetails, wallet) => {
    let now = new Date();
    console.log(`Time Now ${now}`);
    let qRes = await queryContract(deploymentDetails.proxyContractAddress, {
        get_bonding_details: {
            user_address: marketing_wallet.key.accAddress
        }
    });

    let maturedReward = 0;
    let unMaturedReward = 0;
    let status;
    for (var i = 0; i < qRes.length; i++) {
        let msec = Math.trunc(Number(qRes[i].bonding_start_timestamp)/1000000);
        let d = new Date(msec);
        let msecAdd = msec+Number(qRes[i].bonding_period)*1000;
        let dplus = new Date(msecAdd);
        if (now > dplus) {
            maturedReward += Number(qRes[i].bonded_amount);
            status = "Matured"
        } else {
            unMaturedReward += Number(qRes[i].bonded_amount);
            status = "Not Matured"
        }
        console.log(`${i} : Start:${d} Duration(sec):${qRes[i].bonding_period} Amount ${qRes[i].bonded_amount} , Status ${status}`);
    }
    console.log(`Matured Amount ${maturedReward}`);
    console.log(`Not Matured Amount ${unMaturedReward}`);
    const rewardQry = await question('How much amount you wish to claim ? ');
    let rewardAmount = Number(rewardQry);
    if (rewardAmount > maturedReward) {
        let goAheadResponse = await question(`Try More than Matured Amount ${maturedReward} ? `); 
        if (goAheadResponse === 'Y' || goAheadResponse === 'y') {
            console.log('trying');
        } else {
            return
        }
    }

    let rewardClaimMsg = {
        reward_claim: {
            receiver: marketing_wallet.key.accAddress,
            withdrawal_amount: rewardAmount.toString(),
        }
    };
    let platformFees = await queryContract(deploymentDetails.proxyContractAddress, { query_platform_fees: { msg: Buffer.from(JSON.stringify(rewardClaimMsg)).toString('base64') } });
    console.log(`platformFees = ${JSON.stringify(platformFees)} uusd`);

    let response;

    try {
        console.log(`rewardClaimMsg = ${JSON.stringify(rewardClaimMsg)}`);
        response = await executeContract(marketing_wallet, deploymentDetails.proxyContractAddress, rewardClaimMsg, { 'uusd': Number(platformFees) });
        console.log("Withdraw Reward transaction hash = " + response['txhash']);
    } catch (error) {
        console.log(error);
    } finally {
        console.log("Withdraw Complete");
    }
    return;

}


main()
