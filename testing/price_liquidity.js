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
        console.log(`Wallet to be used treasury_wallet ${treasury_wallet.key.accAddress}`);
        let deploymentDetails = readArtifact(terraClient.chainID);
        await priceLiquidityAdjustment(deploymentDetails,treasury_wallet,false);
    } catch (error) {
        console.log(error);
    }
    rl.close()
}
const priceLiquidityAdjustment = async (deploymentDetails, wallet, checkOnly) => {
    let furyBalanceQuery = await queryContract(deploymentDetails.furyContractAddress, {
                                                balance: { address : wallet.key.accAddress}
                                                });
    let bankResp = await queryBank(wallet.key.accAddress);
    let uusd_balance = Number(bankResp[0]._coins.uusd.amount);
    let fury_balance = Number(furyBalanceQuery.balance);
    console.log(`Wallet Balance uusd : ${uusd_balance},  uFury : ${fury_balance}`);
    let poolQuery = await queryContract(deploymentDetails.proxyContractAddress, {
                pool: {}
            });
    let uusd_pool = Number(poolQuery.assets[1].amount);
    let fury_pool = Number(poolQuery.assets[0].amount);
    console.log(`Pool uFury = ${fury_pool} Pool uusd ${uusd_pool} UST`);
    let furyPrice = Number(poolQuery.assets[1].amount)/Number(poolQuery.assets[0].amount);
    console.log(`Price of 1 Fury = ${furyPrice} UST`);
    let targer_price = await question('What is the target Price you wish to achieve ? ');
    let uusd_amount;
    let fury_amount;
    let goAheadMsg;
    let executeMsg;
    if (targer_price > furyPrice) {
        uusd_amount = Math.trunc((Math.sqrt(targer_price/furyPrice) - 1)*uusd_pool);
        goAheadMsg = "Need to Swap UST to Fury to increase price, Swap UST amount : "+uusd_amount.toString();
    } else {
        fury_amount = Math.trunc((Math.sqrt(furyPrice/targer_price) - 1)*fury_pool);
        goAheadMsg = "Need to Swap Fury to UST to decrease price, Swap Fury amount : "+fury_amount.toString();
    }
    if (checkOnly)     {
        return;
    }
    let goAheadResponse = await question(`${goAheadMsg}, Wish to Proceed? `); 
    if (goAheadResponse === 'Y' || goAheadResponse === 'y') {
        if (targer_price > furyPrice) {
            await buyFuryTokens(deploymentDetails,wallet,uusd_amount);
        } else {
            await sellFuryTokens(deploymentDetails,wallet,fury_amount);
        }
    } else {
        return;
    }




}

async function buyFuryTokens(deploymentDetails,wallet,amount) {
    let buyFuryMsg = {
        swap: {
            to: wallet.key.accAddress,
            offer_asset: {
                info: {
                    native_token: {
                        denom: "uusd"
                    }
                },
                amount: amount.toString()
            },
            max_spread: "0.5"
        }
    };
    let tax = await terraClient.utils.calculateTax(new Coin("uusd", amount.toString()));
    console.log(`tax = ${tax}`);
    let funds = amount + Number(tax.amount);
    console.log(`funds + tax = ${funds}`);

    let platformFees = await queryContract(deploymentDetails.proxyContractAddress, { query_platform_fees: { msg: Buffer.from(JSON.stringify(buyFuryMsg)).toString('base64') } });
    console.log(`platformFees = ${JSON.stringify(platformFees)}`);
    funds = funds + Number(platformFees);
    console.log(`funds + tax + platform fees = ${funds}`);

    let buyFuryResp = await executeContract(wallet, deploymentDetails.proxyContractAddress, buyFuryMsg, { 'uusd': funds });
    console.log(`Buy Fury swap response tx hash = ${buyFuryResp['txhash']}`);
}

async function sellFuryTokens(deploymentDetails,wallet,amount) {
    let increaseAllowanceMsg = {
        increase_allowance: {
            spender: deploymentDetails.proxyContractAddress,
            amount: amount.toString()
        }
    };
    let incrAllowResp = await executeContract(wallet, deploymentDetails.furyContractAddress, increaseAllowanceMsg);
    console.log("increase allowance resp tx = " + incrAllowResp['txhash']);
    let sellFuryMsg = {
        swap: {
            to: wallet.key.accAddress,
            offer_asset: {
                info: {
                    token: {
                        contract_addr: deploymentDetails.furyContractAddress
                    }
                },
                amount: amount.toString()
            },
            max_spread: "0.5"
        }
    };
    let platformFees = await queryContract(deploymentDetails.proxyContractAddress, { query_platform_fees: { msg: Buffer.from(JSON.stringify(sellFuryMsg)).toString('base64') } });
    console.log(`platformFees = ${JSON.stringify(platformFees)}`);
    let funds = Number(platformFees);
    console.log(`funds + platform fees = ${funds}`);

    let sellFuryResp = await executeContract(wallet, deploymentDetails.proxyContractAddress, sellFuryMsg, { 'uusd': funds });
    console.log(`Sell Fury swap response tx hash = ${sellFuryResp['txhash']}`);
}



const increasePOLRewardAllowance = async (deploymentDetails,wallet,checkOnly) => {
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
    if (respBalance > respAllowance && !checkOnly) {
        let increase_amount = respBalance - respAllowance;
        let execMsg = {increase_allowance: { spender : deploymentDetails.proxyContractAddress, amount: increase_amount.toString()}};
        let execResponse = await executeContract (wallet, deploymentDetails.furyContractAddress, execMsg);
        console.log(`POL increase allowance by ${increase_amount} uFury for proxy in wallet ${wallet.key.accAddress}, txhash ${execResponse['txhash']}`);
    }
}
main()
