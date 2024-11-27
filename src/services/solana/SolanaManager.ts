import * as web3 from '@solana/web3.js';
import * as spl from '@solana/spl-token';
import { newConnection } from "./lib/solana";
import { WalletModel } from "./types";
import base58 from "bs58";
import { RpcManager } from "./RpcManager";
import { TransactionMessage } from "@solana/web3.js";
import { Keypair } from "@solana/web3.js";
import { Helpers } from "../helpers/Helpers";

export interface CreateTransactionResponse {
    tx: web3.Transaction,
    blockhash: web3.BlockhashWithExpiryBlockHeight,
}

export interface TokenBalance {
    amount: number;
    uiAmount: number;
    decimals?: number;
    ataPubKey?: web3.PublicKey;
}

export class SolanaManager {

    static createWallet(): WalletModel {
        const keyPair = web3.Keypair.generate();

        return {
            publicKey: keyPair.publicKey.toString(),
            privateKey: base58.encode(Array.from(keyPair.secretKey)),
        }
    }
    
    static async createSplTransferInstructions(web3Conn: web3.Connection, splTokenMintPublicKey: web3.PublicKey, amount: number, decimals: number, fromPublicKey: web3.PublicKey, toPublicKey: web3.PublicKey, feePayerPublicKey: web3.PublicKey): Promise<web3.TransactionInstruction[]>{
        const fromTokenAddress = await spl.getAssociatedTokenAddress(splTokenMintPublicKey, fromPublicKey);
        const toTokenAddress = await spl.getAssociatedTokenAddress(splTokenMintPublicKey, toPublicKey);
        const instructions: web3.TransactionInstruction[] = [];

        const instruction1 = await this.getInstrucionToCreateTokenAccount(web3Conn, splTokenMintPublicKey, fromTokenAddress, fromPublicKey, feePayerPublicKey);
        if (instruction1 != undefined){
            instructions.push(instruction1);
        }

        const instruction2 = await this.getInstrucionToCreateTokenAccount(web3Conn, splTokenMintPublicKey, toTokenAddress, toPublicKey, feePayerPublicKey);
        if (instruction2 != undefined){
            instructions.push(instruction2);
        }

        instructions.push(
            spl.createTransferInstruction(
                fromTokenAddress, 
                toTokenAddress, 
                fromPublicKey, 
                Math.floor(amount * 10**decimals)
            )
        );
    
        return instructions;
    }  

    static async createSplAccountInstruction(tokenMintPublicKey: web3.PublicKey, walletPublicKey: web3.PublicKey, feePayerPublicKey: web3.PublicKey, tokenAddress?: web3.PublicKey): Promise<web3.TransactionInstruction>{
        if (!tokenAddress){
            tokenAddress = await spl.getAssociatedTokenAddress(tokenMintPublicKey, walletPublicKey);
        }

        console.log(new Date(), process.env.SERVER_NAME, 'createSplAccountInstruction', 'tokenAddress', tokenAddress.toBase58());
        return spl.createAssociatedTokenAccountInstruction(
            feePayerPublicKey,
            tokenAddress,
            walletPublicKey,
            tokenMintPublicKey,
            spl.TOKEN_PROGRAM_ID,
            spl.ASSOCIATED_TOKEN_PROGRAM_ID
        );    
    }  

    static async createSolTransferInstruction(fromPublicKey: web3.PublicKey, toPublicKey: web3.PublicKey, lamports: number): Promise<web3.TransactionInstruction> {
        return web3.SystemProgram.transfer({
            fromPubkey: fromPublicKey,
            toPubkey: toPublicKey,
            lamports: lamports,
        });
    }

    static async getInstrucionToCreateTokenAccount(
        web3Conn: web3.Connection, 
        tokenMintPublicKey: web3.PublicKey, 
        tokenAccountAddressPublicKey: web3.PublicKey, 
        ownerAddressPublicKey: web3.PublicKey, 
        feePayerPublicKey: web3.PublicKey
    ): Promise<web3.TransactionInstruction | undefined> {

        try {
            const account = await spl.getAccount(
                web3Conn, 
                tokenAccountAddressPublicKey, 
                undefined, 
                spl.TOKEN_PROGRAM_ID
            );
        } catch (error: unknown) {
            if (error instanceof spl.TokenAccountNotFoundError || error instanceof spl.TokenInvalidAccountOwnerError) {
                return spl.createAssociatedTokenAccountInstruction(
                    feePayerPublicKey,
                    tokenAccountAddressPublicKey,
                    ownerAddressPublicKey,
                    tokenMintPublicKey,
                    spl.TOKEN_PROGRAM_ID,
                    spl.ASSOCIATED_TOKEN_PROGRAM_ID
                );
            } else {
                throw error;
            }
        }
    }

    static async getWalletSolBalance(web3Conn: web3.Connection, walletAddress: string): Promise<TokenBalance | undefined>{
        try {
            const mainWalletPublicKey = new web3.PublicKey(walletAddress);
            const balance = await web3Conn.getBalance(mainWalletPublicKey);
            return {amount: balance, uiAmount: Math.round(100 * balance / web3.LAMPORTS_PER_SOL) / 100, decimals: 9};
        }
        catch (err){
            console.error('getWalletSolBalance', err);
        }

        return undefined;
    }

    static async getWalletTokenBalance(web3Conn: web3.Connection, walletAddress: string, tokenAddress: string): Promise<TokenBalance>{
        try {
            // console.log(new Date(), process.env.SERVER_NAME, 'getWalletTokenBalance', 'walletAddress', walletAddress, 'tokenAddress', tokenAddress);
            const mainWalletPublicKey = new web3.PublicKey(walletAddress);
            const tokenPublicKey = new web3.PublicKey(tokenAddress);
            const tmp = await web3Conn.getParsedTokenAccountsByOwner(mainWalletPublicKey, {mint: tokenPublicKey});
            // console.log(new Date(), process.env.SERVER_NAME, 'getWalletTokenBalance', 'tmp', JSON.stringify(tmp));

            return {
                amount: +(tmp.value[0].account.data.parsed.info.tokenAmount.amount), 
                uiAmount: +(tmp.value[0].account.data.parsed.info.tokenAmount.uiAmount),
                decimals: tmp.value[0].account.data.parsed.info.tokenAmount.decimals,
                ataPubKey: tmp.value[0].pubkey
            }
        }
        catch (err){
            // console.error('getWalletTokenBalance', err);
        }

        return {amount: 0, uiAmount: 0};
    }

    static async getWalletTokensBalances(web3Conn: web3.Connection, walletAddress: string): Promise<{mint: string, balance: TokenBalance}[]>{
        try {
            // console.log(new Date(), process.env.SERVER_NAME, 'getWalletTokenBalance', 'walletAddress', walletAddress, 'tokenAddress', tokenAddress);
            const mainWalletPublicKey = new web3.PublicKey(walletAddress);
            const accounts = await web3Conn.getParsedTokenAccountsByOwner(mainWalletPublicKey, { programId: spl.TOKEN_PROGRAM_ID });

            console.log('!accounts', JSON.stringify(accounts));

            const balances: {mint: string, balance: TokenBalance}[] = [];
            for (const element of accounts.value) {
                if (
                    element.account.data.parsed.info.mint && 
                    element.account.data.parsed.info.tokenAmount.amount && 
                    element.account.data.parsed.info.tokenAmount.uiAmount &&
                    element.account.data.parsed.info.tokenAmount.decimals &&
                    element.pubkey
                ){
                    balances.push({
                        mint: element.account.data.parsed.info.mint,
                        balance: {
                            amount: +(element.account.data.parsed.info.tokenAmount.amount), 
                            uiAmount: +(element.account.data.parsed.info.tokenAmount.uiAmount),
                            decimals: element.account.data.parsed.info.tokenAmount.decimals,
                            ataPubKey: element.pubkey    
                        }
                    });
                }
            }

            return balances;
        }
        catch (err){
            // console.error('getWalletTokenBalance', err);
        }

        return [];
    }
    
    static async createVersionedTransaction(instructions: web3.TransactionInstruction[], keypair: web3.Keypair, blockhash?: string): Promise<web3.VersionedTransaction> {
        if (!blockhash) {
            blockhash = (await SolanaManager.getRecentBlockhash()).blockhash;
        }

        const versionedTransaction = new web3.VersionedTransaction(
            new TransactionMessage({
                payerKey: keypair.publicKey,
                recentBlockhash: blockhash,
                instructions: instructions,
            }).compileToV0Message()
        );

        versionedTransaction.sign([keypair])
        return versionedTransaction;
    }

    static async fetchTransaction(signature: string) {
        const connection = newConnection();
        const tx = connection.getTransaction(signature, {commitment: 'confirmed', maxSupportedTransactionVersion: 0});
        return tx;
    }

    static async createFreezeAccountTransaction(mint: web3.PublicKey, account: web3.PublicKey, freezeAuthority: web3.Keypair, blockhash?: string): Promise<web3.VersionedTransaction> {
        const instructions = [
            spl.createFreezeAccountInstruction(account, mint, freezeAuthority.publicKey)
        ];

        const transaction = await this.createVersionedTransaction(instructions, freezeAuthority, blockhash);
        return transaction;
    }

    static async createThawAccountTransaction(mint: web3.PublicKey, account: web3.PublicKey, freezeAuthority: web3.Keypair, blockhash?: string): Promise<web3.VersionedTransaction> {
        const instructions = [
            spl.createThawAccountInstruction(account, mint, freezeAuthority.publicKey)
        ];

        const transaction = await this.createVersionedTransaction(instructions, freezeAuthority, blockhash);
        return transaction;
    }

    static async getTokenSupply(mint: web3.PublicKey): Promise<web3.TokenAmount | undefined> {
        try {
            const connection = newConnection();
            const supply = await connection.getTokenSupply(mint);
            return supply.value;
        }
        catch (err){
            console.error('getTokenSupply', err);
        }
    }

    static async signAndSendTx(tx: web3.VersionedTransaction, keypair: Keypair) {
        tx.sign([keypair]);

        const rawTransaction = tx.serialize();
        const options: web3.SendOptions = {
            skipPreflight: true,
            maxRetries: 0,
        }

        console.log(new Date(), process.env.SERVER_NAME, 'sendTransaction');
        const connection = newConnection(process.env.SOLANA_RPC);
        connection.sendRawTransaction(rawTransaction, options);    
    }

    static isValidPublicKey(publicKey: string): boolean {
        try {
            const pk = new web3.PublicKey(publicKey);
            return web3.PublicKey.isOnCurve(pk);
        }
        catch (err){
            console.error('isValidPublicKey', err);
        }

        return false;
    }

    static async getParsedTransaction(web3Conn: web3.Connection, signature: string, tries: number = 3): Promise<web3.ParsedTransactionWithMeta | undefined>{
        const txs = await this.getParsedTransactions(web3Conn, [signature], tries);
        return txs.length > 0 ? txs[0] : undefined;
    }

    static async getParsedTransactions(web3Conn: web3.Connection, signatures: string[], tries: number = 3): Promise<web3.ParsedTransactionWithMeta[]>{
        if (signatures.length == 0) return [];

        let txs: (web3.ParsedTransactionWithMeta | null)[] = [];

        while (txs.length==0 && tries > 0){
            try {
                txs = await web3Conn.getParsedTransactions(signatures, {commitment: 'confirmed', maxSupportedTransactionVersion: 0});
            }
            catch (err){}
            tries--;

            if (!txs){
                await Helpers.sleep(1);
            }
        }

        return txs.filter(tx => tx != null) as web3.ParsedTransactionWithMeta[];
    }

    static async sendSol(from: WalletModel, to: string, amount: number, retries: number): Promise<{err?: string, signature?: string}> {
        const fromWallet = web3.Keypair.fromSecretKey(base58.decode(from.privateKey));
        const toWallet = new web3.PublicKey(to);
        const lamports = Math.floor(amount * web3.LAMPORTS_PER_SOL);
        if (lamports != amount * web3.LAMPORTS_PER_SOL){
            return {err: 'Invalid amount'};
        }

        const instructions = [
            web3.SystemProgram.transfer({
                fromPubkey: fromWallet.publicKey,
                toPubkey: toWallet,
                lamports: lamports,
            })
        ];

        const signature = await RpcManager.sendSmartTransaction(instructions, fromWallet);
        let success = false;
        if (signature){
            success = await RpcManager.pollTransactionConfirmation(signature);
        }

        if (!success){
            if (retries > 0){
                return await this.sendSol(from, to, amount, retries - 1);
            }
            else {
                return {err: 'Failed to send transaction'};
            }
        }

        return { signature: signature }
    }

    static async sendSplToken(from: WalletModel, to: string, amount: number, mint: string, decimals: number, retries: number): Promise<{err?: string, signature?: string}> {
        const fromWallet = web3.Keypair.fromSecretKey(base58.decode(from.privateKey));
        const toWallet = new web3.PublicKey(to);
        const lamports = Math.floor(amount * (10**decimals));
        if (lamports != amount * (10**decimals)){
            return {err: 'Invalid amount'};
        }

        const connection = newConnection();
        const instructions = await this.createSplTransferInstructions(connection, new web3.PublicKey(mint), amount, decimals, fromWallet.publicKey, toWallet, fromWallet.publicKey);

        const signature = await RpcManager.sendSmartTransaction(instructions, fromWallet);
        console.log(new Date(), process.env.SERVER_NAME, 'sendSplToken', 'signature', signature);
        let success = false;
        if (signature){
            success = await RpcManager.pollTransactionConfirmation(signature);
        }

        console.log(new Date(), process.env.SERVER_NAME, 'sendSplToken', 'success', success);            

        if (!success){
            if (retries > 0){
                return await this.sendSplToken(from, to, amount, mint, decimals, retries - 1);
            }
            else {
                return {err: 'Failed to send transaction'};
            }
        }

        return { signature: signature }
    }


    // ---------------------
    private static recentBlockhash: web3.BlockhashWithExpiryBlockHeight | undefined;
    static async getRecentBlockhash(): Promise<web3.BlockhashWithExpiryBlockHeight> {
        if (!SolanaManager.recentBlockhash){
            await this.updateBlockhash();
        }
        return SolanaManager.recentBlockhash!;
    }
    static async updateBlockhash(){
        try {
            const web3Conn = newConnection();
            SolanaManager.recentBlockhash = await web3Conn.getLatestBlockhash();    
        }
        catch (err){
            console.error('updateBlockhash', err);
        }
    }
    

}