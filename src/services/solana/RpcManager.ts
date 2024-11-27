import { AddressLookupTableAccount, Keypair, TransactionInstruction } from '@solana/web3.js';
import { SolanaManager } from './SolanaManager';
import { newConnection } from './lib/solana';
import { Helpers } from '../helpers/Helpers';

export interface TokenHolder {
    owner: string;
    account: string;
    amount: string;
    uiAmount: number;
}

export interface Asset {
    mint: string;
    symbol: string;
    name: string;
    decimals: number;
    balance: number;
}

export class RpcManager {

    static async getAssetsByOwner(walletAddress: string, page = 1): Promise<{nativeBalance?: {lamports: number}, items: Asset[]}> {
        try{
            const web3Conn = newConnection();
            const solBalance = await SolanaManager.getWalletSolBalance(web3Conn, walletAddress);
            let nativeBalance = solBalance ? {lamports: solBalance.amount} : undefined;

            const balances = await SolanaManager.getWalletTokensBalances(web3Conn, walletAddress);
            const tokens: Asset[] = balances.map((balance) => {
                return {
                    mint: balance.mint,
                    symbol: balance.mint,
                    name: balance.mint,
                    decimals: balance.balance.decimals || 0,
                    balance: balance.balance.amount,
                };
            });

            return { nativeBalance , items: tokens};
        }
        catch (e){
            console.error('getAssetsByOwner', e);
            return {items: []};
        }
    }
        
    static async sendSmartTransaction(instructions: TransactionInstruction[], keypair: Keypair): Promise<string | undefined>{
        try{
            const web3Conn = newConnection();
            const recentBlockhash = await web3Conn.getLatestBlockhash();    

            const tx = await SolanaManager.createVersionedTransaction(instructions, keypair, recentBlockhash.blockhash);
            const transactionSignature = await web3Conn.sendTransaction(tx);
            return transactionSignature;
        }
        catch (err){
            console.error('sendSmartTransaction', err);
        }

        return undefined;
    }

    static async pollTransactionConfirmation(signature: string): Promise<boolean>{
        try{
            const web3Conn = newConnection();
            let tries = 60;
            while (tries > 0){
                const status = await web3Conn.getSignatureStatus(signature);
                if (status){
                    if (status.value?.confirmationStatus === 'confirmed' || status.value?.confirmationStatus === 'finalized'){
                        return true;
                    }
                }
                tries--;
                await Helpers.sleep(1); // sleep 1 second
            }
        }
        catch (err){
            console.error('pollTransactionConfirmation', err);
        }

        return false;
    }

}