import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { IUser } from "../../../entities/User";
import { kSolAddress } from "../../../services/solana/Constants";
import { RpcManager } from "../../../services/solana/RpcManager";
import { BotHelper, Message } from "./BotHelper";

export class BotBalanceHelper extends BotHelper {

    constructor() {
        console.log('BotBalanceHelper', 'constructor');

        const replyMessage: Message = {
            text: '',
        };

        super('balance', replyMessage);
    }

    async commandReceived(ctx: any, user: IUser) {
        console.log('WALLET', 'commandReceived', 'user:', user);

        const assets = await RpcManager.getAssetsByOwner(user.wallet.publicKey);
        console.log('assets:', JSON.stringify(assets));


        const tokens: {symbol: string, mint: string, balance: number, usdValue?: number}[] = [];

        if (assets.nativeBalance && assets.nativeBalance.lamports>0){
            tokens.push({
                symbol: 'SOL',
                mint: kSolAddress,
                balance: assets.nativeBalance.lamports / LAMPORTS_PER_SOL,
            });
        }

        for (const asset of assets.items) {
            if (asset && asset.balance && asset.symbol){
                const balance = asset.balance / (10 ** asset.decimals);
                // const usdValue = asset.token_info.price_info?.price_per_token ? balance * asset.token_info.price_info.price_per_token : undefined
                tokens.push({
                    symbol: asset.symbol,
                    mint: asset.mint,
                    balance,
                    // usdValue,
                });
            }
        }

        let message = '';
        if (tokens.length == 0){
            message = `You have no tokens. Fund your wallet to use TipMe.\n\nWallet address: ${user.wallet.publicKey}\n\n🚨 ONLY COINS ON SOON ARE ACCEPTED`;
        }
        else {
            message = 'Your balance:\n';
         
            for (const token of tokens) {
                message += `<a href="https://solscan.io/account/${token.mint}">${token.symbol.toUpperCase()}</a>: ${token.balance}`;
                if (token.usdValue){
                    message += ` ($${Math.floor(token.usdValue * 100) / 100})`;
                }
                message += '\n';
    
            }
        }

        ctx.reply(message, {
            parse_mode: 'HTML', 
            link_preview_options: {
                is_disabled: true
            },
        });

    }

}