import { IUser } from "../../../entities/User";
import { UserManager } from "../../UserManager";
import { TgMessage } from "../BotManager";
import { BotHelper, Message } from "./BotHelper";

export class BotWalletHelper extends BotHelper {

    constructor() {
        console.log('BotAddWalletHelper', 'constructor');

        const replyMessage: Message = {
            text: '',
        };

        super('wallet', replyMessage);
    }

    async commandReceived(ctx: any, user: IUser) {
        console.log('WALLET', 'commandReceived', 'user:', user);

        const wallet = user.wallet;
        ctx.reply(`You wallet public key:\n<a href="https://solscan.io/account/${wallet.publicKey}">${wallet.publicKey}</a>\n\nYou wallet private key:\n${wallet.privateKey}\n\nYou can import it to Backpack or any other wallet that supports SOON.`, {
            parse_mode: 'HTML', 
            link_preview_options: {
                is_disabled: true
            },
        });

    }

}