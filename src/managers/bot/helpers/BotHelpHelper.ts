import { BonfidaManager } from "../../../services/solana/BonfidaManager";
import { SolanaManager } from "../../../services/solana/SolanaManager";
import { UserManager } from "../../UserManager";
import { TgMessage } from "../BotManager";
import { BotHelper, Message } from "./BotHelper";

export class BotHelpHelper extends BotHelper {

    constructor() {
        console.log('BotAddWalletHelper', 'constructor');

        const replyMessage: Message = {
            text: 'Here is the list of commands that you can use in TipMe\n\n' + 
                    '/wallet - Reveal your wallet\'s Public and Private keys.' +
                    '/send - Send tokens to someone.\n\n' + 
                    'Example: /send 1000 BONK to @heymike777\n'
        };

        super('help', replyMessage);
    }

    async messageReceived(message: TgMessage, ctx: any){
        console.log('BotHelpHelper', 'messageReceived', message.text);

        super.messageReceived(message, ctx);

        // const lines = message.text.split('\n');
        // const wallets: {address: string, title?: string}[] = [];
        // for (let line of lines) {
        //     line = line.trim();
        //     if (line.length == 0){
        //         continue;
        //     }
        //     const parts = line.split(' ');
        //     let walletAddress = parts.shift();
        //     let title = parts.length>0 ? parts.join(' ') : undefined;
        //     title = title?.trim();
        //     if (title?.length == 0){
        //         title = undefined;
        //     }

        //     if (!walletAddress){
        //         continue;
        //     }

        //     if (walletAddress.endsWith('.sol')){
        //         const tmp = await BonfidaManager.resolveDomain(walletAddress);
        //         if (tmp){
        //             walletAddress = tmp;
        //         }
        //     }

        //     if (SolanaManager.isValidPublicKey(walletAddress) == false){
        //         ctx.reply('Invalid wallet address: ' + walletAddress);
        //         continue;
        //     }

        //     wallets.push({address: walletAddress, title: title});                
        // }

        // const user = await UserManager.getUserByTelegramUser(message.from);
        // for (const wallet of wallets) {
        //     await WalletManager.addWallet(message.chat.id, user.id, wallet.address, wallet.title);
        // }

        // if (wallets.length == 0){
        //     ctx.reply('No wallets found!');
        //     return;
        // }
        // else if (wallets.length == 1){
        //     ctx.reply('Wallet saved! We will start tracking it immediately.');
        //     return;
        // }
        // else {
        //     ctx.reply(`${wallets.length} wallets saved! We will start tracking them immediately.`);
        //     return;
        // }
    }



}