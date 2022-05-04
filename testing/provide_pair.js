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
        await providePairInvestment(deploymentDetails,marketing_wallet,false);
    } catch (error) {
        console.log(error);
    }
    rl.close()
}
const providePairInvestment = async (deploymentDetails, wallet, checkOnly) => {
    let proxyQuery = await queryContract(deploymentDetails.proxyContractAddress, {
                configuration: {}
            });
    let poolQuery = await queryContract(deploymentDetails.proxyContractAddress, {
                pool: {}
            });
    let furyBalanceQuery = await queryContract(deploymentDetails.furyContractAddress, {
                                                balance: { address : wallet.key.accAddress}
                                                });
    console.log(`Pool uFury = ${Number(poolQuery.assets[0].amount)} Pool uusd ${Number(poolQuery.assets[1].amount)} UST`);
    let furyPrice = Number(poolQuery.assets[1].amount)/Number(poolQuery.assets[0].amount);
    console.log(`Price of 1 Fury = ${furyPrice} UST`);
    let resp = await queryBank(treasury_wallet.key.accAddress);
    let uusd_balance = Number(resp[0]._coins.uusd.amount);
    let fury_balance = Number(furyBalanceQuery.balance);
    console.log(`Balance of ${wallet.key.accAddress}  uusd : ${uusd_balance}, can pe paired with uFury ${Math.trunc(uusd_balance/furyPrice)}`);
    console.log(`           ${wallet.key.accAddress} uFury : ${fury_balance},                    uusd  ${Math.trunc(fury_balance*furyPrice)}`);
    const uusdInput = await question('How much uusd tokens you wish to transfer to LiquidityPool ? ');
    let uusd_amount = Number(uusdInput);
    let fury_amount = Math.trunc(uusd_amount*Number(poolQuery.assets[0].amount)/Number(poolQuery.assets[1].amount));

    if (uusd_balance < uusd_amount)     {
        console.log(`uusd Available ${uusd_balance}`);
        return;
    }
    if (fury_balance < fury_amount)     {
        console.log(`uFury Required ${fury_amount}`);
        return;
    }
    if (checkOnly)     {
        return;
    }

    console.log(`Fury Required ${fury_amount}`);
    let goAheadResponse = await question(`Wish to Proceed? `); 
    if (goAheadResponse === 'Y' || goAheadResponse === 'y') {

        // First increase allowance for proxy to spend from mint_wallet wallet
        let increaseAllowanceMsg = {
            increase_allowance: {
                spender: deploymentDetails.proxyContractAddress,
                amount: fury_amount.toString()
            }
        };
        let incrAllowResp = await executeContract(wallet, deploymentDetails.furyContractAddress, increaseAllowanceMsg);
        console.log(`Increase allowance response hash = ${incrAllowResp['txhash']}`);
        let executeMsg = {
            provide_pair_for_reward: {
                assets: [
                    {
                        info: {
                            native_token: {
                                denom: "uusd"
                            }
                        },
                        amount: uusd_amount.toString()
                    },
                    {
                        info: {
                            token: {
                                contract_addr: deploymentDetails.furyContractAddress
                            }
                        },
                        amount: fury_amount.toString()
                    }
                ]
            }
        };
        let tax = await terraClient.utils.calculateTax(new Coin("uusd", uusd_amount.toString()));
        console.log(`tax = ${tax}`);

        let platformFees = await queryContract(deploymentDetails.proxyContractAddress, { query_platform_fees: { msg: Buffer.from(JSON.stringify(executeMsg)).toString('base64') } });
        console.log(`platformFees = ${JSON.stringify(platformFees)}`);

        let funds = Number(uusd_amount);
        funds = funds + Number(tax.amount);
        funds = funds + Number(platformFees);
        console.log(`funds + tax + platform fees = ${funds}`);

        console.log(`funds = ${funds}`);
        let response = await executeContract(wallet, deploymentDetails.proxyContractAddress, executeMsg, { 'uusd': funds });
        console.log(`Provide Pair (from ${wallet.key.accAddress}) Response - ${response['txhash']}`);
    }

}


main()
