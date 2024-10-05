import { TgMessage } from "../BotManager";
import { BotHelper, Message } from "./BotHelper";

export class BotWalletHelper extends BotHelper {

    constructor() {
        console.log('BotAddWalletHelper', 'constructor');

        const replyMessage: Message = {
            text: '',
        };

        super('help', replyMessage);
    }

    async messageReceived(message: TgMessage, ctx: any){
        console.log('BotWalletHelper', 'messageReceived', message.text);

        

        // super.messageReceived(message, ctx);
    }



}