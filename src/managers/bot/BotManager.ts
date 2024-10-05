import { Bot, InlineKeyboard } from "grammy";
import { BotHelper } from "./helpers/BotHelper";
import { BotStartHelper } from "./helpers/BotStartHelper";
import { UserManager } from "../UserManager";
import { IUser } from "../../entities/User";
import { autoRetry } from "@grammyjs/auto-retry";
import { InlineKeyboardMarkup } from "grammy/types";
import { ExplorerManager } from "../../services/explorers/ExplorerManager";
import { Chain } from "../../services/solana/types";
import { BotHelpHelper } from "./helpers/BotHelpHelper";

export interface SendMessageData {
    chatId: number;
    text?: string;
    imageUrl?: string;
    inlineKeyboard?: InlineKeyboardMarkup;
}

export interface TgMessage {
    message_id: number;
    from: {
        id: number;
        is_bot: boolean;
        first_name: string;
        last_name: string;
        username: string;
        language_code: string;
        is_premium: boolean;
    };
    chat: {
        id: number;
        first_name: string;
        username: string;
        type: string;
    };
    date: number;
    text: string;
    entities: any[];
}

export class BotManager {
    bot: Bot;
    helpers: BotHelper[] = [
        new BotStartHelper(),
        new BotHelpHelper(),
    ];

    constructor() {
        console.log('BotManager', 'constructor');

        console.log('Starting bot...');
        this.bot = new Bot(process.env.TELEGRAM_BOT_TOKEN!);

        this.bot.api.config.use(autoRetry());
    
        this.bot.on('message', (ctx) => {
            this.onMessage(ctx.update.message as TgMessage, ctx);
        });
    
        this.bot.start();
        console.log('Bot started!');    
    }

    async onCommand(command: string, ctx: any, user: IUser){
        const helper = await this.findHelperByCommand(command);
        if (helper){
            helper.commandReceived(ctx, user);
        }
        else {
            console.error('Unknown command', command);
        } 
    }

    async onMessage(message: TgMessage, ctx: any){
        console.log('onMessage', message);

        const user = await UserManager.getUserByTelegramUser(message.from);

        if (message.text.startsWith('/')){
            const command = message.text.substring(1);
            this.onCommand(command, ctx, user);
            return;
        }

    }

    async findHelperByCommand(command: string): Promise<BotHelper | undefined> {
        if (command.startsWith('start')){
            return this.helpers.find(helper => helper.kCommand == 'start');
        }

        return this.helpers.find(helper => helper.kCommand == command);
    }

    async sendMessage(data: SendMessageData){
        if (data.imageUrl){
            this.bot.api.sendPhoto(data.chatId, data.imageUrl, {
                caption: data.text,
                parse_mode: 'HTML', 
                reply_markup: data.inlineKeyboard,
            });    
        }
        else {
            this.bot.api.sendMessage(data.chatId, data.text || '', {
                parse_mode: 'HTML', 
                link_preview_options: {
                    is_disabled: true
                },
                reply_markup: data.inlineKeyboard,
            });    
        }
    }

    // -------- static --------
    static instance: BotManager | undefined = undefined;
    static async getInstance() {
        if (!BotManager.instance) {
            BotManager.instance = new BotManager();
        }
        return BotManager.instance;        
    }

    static async sendSystemMessage(text: string, chatId: number = +process.env.TELEGRAM_SYSTEM_CHAT_ID!){
        const botManager = await BotManager.getInstance();
        await botManager.sendMessage({chatId, text});
    }

    static async sendMessage(data: SendMessageData){
        const botManager = await BotManager.getInstance();
        await botManager.sendMessage(data);
    }

}