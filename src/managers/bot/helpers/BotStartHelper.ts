import { IUser } from "../../../entities/User";
import { TgMessage } from "../BotManager";
import { BotHelper, Message } from "./BotHelper";

export class BotStartHelper extends BotHelper {

    constructor() {
        console.log('BotStartHelper', 'constructor');

        const replyMessage: Message = {
            text: 'Hey, I am Nova! I can help you with:\n' + 
            '- wallet tracking\n' + 
            '- tokens trading'
        };

        super('start', replyMessage);
    }

    async commandReceived(ctx: any, user: IUser) {
        super.commandReceived(ctx, user);
    }

    async messageReceived(message: TgMessage, ctx: any){
        console.log('BotStartHelper', 'messageReceived', message.text, 'ctx.match:', ctx.match);
        super.messageReceived(message, ctx);
    }

}