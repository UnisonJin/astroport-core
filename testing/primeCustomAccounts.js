import {
    walletTest1,
    walletTest2,
    walletTest3,
    walletTest4,
    walletTest5,
    mint_wallet,
    treasury_wallet,
    liquidity_wallet,
    marketing_wallet,
    bonded_lp_reward_wallet,
    terraClient
} from './constants.js';

import { MsgSend } from '@terra-money/terra.js';

export async function primeAccountsWithFunds() {
    var txHash = [];
    txHash.push(await fundMintingWallet());
    txHash.push(await fundTreasuryWallet());
    txHash.push(await fundLiquidityWallet());
    txHash.push(await fundMarketingWallet());
    txHash.push(await transferNativeFund(walletTest5, bonded_lp_reward_wallet));
    console.log("leaving primeCustomAccounts");
    return txHash;
}

function fundMintingWallet() {
    console.log(`Funding ${mint_wallet.key.accAddress} from ${walletTest1.key.accAddress}`);
    return new Promise(resolve => {
        // create a simple message that moves coin balances
        const send1 = new MsgSend(
            walletTest1.key.accAddress,
            mint_wallet.key.accAddress,
            { uluna: 500000000, uusd: 10000000000 }
        );

        walletTest1
            .createAndSignTx({
                msgs: [send1],
                memo: 'Initial Funding!',
            })
            .then(tx => terraClient.tx.broadcast(tx))
            .then(result => {
                console.log(result.txhash);
                if (result.height == 0) {
                    resolve("Failed. Please fund the wallet externally!")
                } else {
                    resolve(result.txhash);
                }
            });
    })
}

function fundTreasuryWallet() {
    console.log(`Funding ${treasury_wallet.key.accAddress} from ${walletTest2.key.accAddress}`);
    return new Promise(resolve => {
        const send2 = new MsgSend(
            walletTest2.key.accAddress,
            treasury_wallet.key.accAddress,
            { uluna: 500000000, uusd: 10000000000 }
        );

        walletTest2
            .createAndSignTx({
                msgs: [send2],
                memo: 'Initial Funding!',
            })
            .then(tx => terraClient.tx.broadcast(tx))
            .then(result => {
                console.log(result.txhash);
                if (result.height == 0) {
                    resolve("Failed. Please fund the wallet externally!")
                } else {
                    resolve(result.txhash);
                }
            });
    })
}

function fundLiquidityWallet() {
    console.log(`Funding ${liquidity_wallet.key.accAddress} from ${walletTest3.key.accAddress}`);
    return new Promise(resolve => {
        const send = new MsgSend(
            walletTest3.key.accAddress,
            liquidity_wallet.key.accAddress,
            { uluna: 500000000, uusd: 10000000000 }
        );

        walletTest3
            .createAndSignTx({
                msgs: [send],
                memo: 'Initial Funding!',
            })
            .then(tx => terraClient.tx.broadcast(tx))
            .then(result => {
                console.log(result.txhash);
                if (result.height == 0) {
                    resolve("Failed. Please fund the wallet externally!")
                } else {
                    resolve(result.txhash);
                }
            });
    })
}

function fundMarketingWallet() {
    console.log(`Funding ${marketing_wallet.key.accAddress} from ${walletTest4.key.accAddress}`);
    return new Promise(resolve => {
        const send = new MsgSend(
            walletTest4.key.accAddress,
            marketing_wallet.key.accAddress,
            { uluna: 500000000, uusd: 10000000000 }
        );

        walletTest4
            .createAndSignTx({
                msgs: [send],
                memo: 'Initial Funding!',
            })
            .then(tx => terraClient.tx.broadcast(tx))
            .then(result => {
                console.log(result.txhash);
                if (result.height == 0) {
                    resolve("Failed. Please fund the wallet externally!")
                } else {
                    resolve(result.txhash);
                }
            });
    })
}

function transferNativeFund(fromWallet, toWallet) {
    console.log(`Funding ${toWallet.key.accAddress} from ${fromWallet.key.accAddress}`);
    return new Promise(resolve => {
        const send = new MsgSend(
            fromWallet.key.accAddress,
            toWallet.key.accAddress,
            { uluna: 500000000, uusd: 10000000000 }
        );

        fromWallet
            .createAndSignTx({
                msgs: [send],
                memo: 'Initial Funding!',
            })
            .then(tx => terraClient.tx.broadcast(tx))
            .then(result => {
                console.log(result.txhash);
                if (result.height == 0) {
                    resolve("Failed. Please fund the wallet externally!")
                } else {
                    resolve(result.txhash);
                }
            });
    })
}