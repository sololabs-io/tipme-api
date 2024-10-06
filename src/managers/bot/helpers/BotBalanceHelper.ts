import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { IUser } from "../../../entities/User";
import { kSolAddress } from "../../../services/solana/Constants";
import { HeliusManager } from "../../../services/solana/HeliusManager";
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

        const assets = await HeliusManager.getAssetsByOwner(user.wallet.publicKey);
        console.log('assets:', JSON.stringify(assets));


        const tokens: {symbol: string, mint: string, balance: number, usdValue?: number}[] = [];

        if (assets.nativeBalance && assets.nativeBalance.total_price>0){
            tokens.push({
                symbol: 'SOL',
                mint: kSolAddress,
                balance: assets.nativeBalance.lamports / LAMPORTS_PER_SOL,
                usdValue: assets.nativeBalance.total_price,
            });
        }

        for (const asset of assets.items) {
            if (asset.token_info && asset.token_info.balance && asset.token_info.symbol){
                const balance = asset.token_info.balance / (10 ** asset.token_info.decimals);
                const usdValue = asset.token_info.price_info?.price_per_token ? balance * asset.token_info.price_info.price_per_token : undefined
                tokens.push({
                    symbol: asset.token_info.symbol,
                    mint: asset.id,
                    balance,
                    usdValue,
                });
            }
        }

        let message = '';
        if (tokens.length == 0){
            message = `You have no tokens. Fund your wallet to use TipMe.\n\nWallet address: ${user.wallet.publicKey}\n\n🚨 ONLY COINS ON THE SOLANA BLOCKCHAIN ARE ACCEPTED`;
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