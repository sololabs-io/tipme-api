import { FutureWallet } from "../entities/FutureWallet";
import { IUser, TelegramUser, User } from "../entities/User";
import { SolanaManager } from "../services/solana/SolanaManager";
import { WalletModel } from "../services/solana/types";

export class UserManager {

    static cachedUsers: {user: IUser, createdAt: Date}[] = [];

    static async getUserById(id: string): Promise<IUser> {
        const cachedUser = this.cachedUsers.find(cachedUser => cachedUser.user.id == id);
        if (cachedUser){
            return cachedUser.user;
        }

        const now = new Date();
        const user = await User.findById(id);
        if (user){
            this.cachedUsers.push({ user: user, createdAt: now });
            return user;
        }
        else {
            throw new Error('User not found');
        }
    }

    static async getUserWalletByTelegramUsername(username: string): Promise<string> {
        if (username.startsWith('@')){
            username = username.substr(1);
        }
        username = username.trim();
        username = username.toLowerCase();

        const cachedUser = this.cachedUsers.find(cachedUser => cachedUser.user.telegram?.username && cachedUser.user.telegram.username.toLowerCase() == username);
        if (cachedUser){
            return cachedUser.user.wallet.publicKey;
        }

        const now = new Date();
        const user = await User.findOne({ 'telegram.username': username });
        if (user){
            this.cachedUsers.push({ user: user, createdAt: now });
            return user.wallet.publicKey;
        }
        else {
            //TODO: create user
            const newFutureWallet = await FutureWallet.create({
                telegramUsername: username,
                isUsed: false,
                createdAt: now,
                wallet: SolanaManager.createWallet(),
            });
            return newFutureWallet.wallet.publicKey;
        }
    }

    static async getUserByTelegramUsername(username: string): Promise<IUser | undefined> {
        if (username.startsWith('@')){
            username = username.substr(1);
        }
        username = username.trim();
        username = username.toLowerCase();

        const cachedUser = this.cachedUsers.find(cachedUser => cachedUser.user.telegram?.username && cachedUser.user.telegram.username.toLowerCase() == username);
        if (cachedUser){
            return cachedUser.user;
        }

        const now = new Date();
        const user = await User.findOne({ 'telegram.username': username });
        if (user){
            this.cachedUsers.push({ user: user, createdAt: now });
            return user;
        }

        return undefined;
    }

    static async getUserByTelegramUser(from: TelegramUser): Promise<IUser> {
        const cachedUser = this.cachedUsers.find(cachedUser => cachedUser.user.telegram?.id === from.id);
        if (cachedUser){
            return cachedUser.user;
        }

        const now = new Date();
        const user = await User.findOne({ 'telegram.id': from.id });
        if (user){
            if (user.telegram?.is_bot !== from.is_bot || user.telegram?.first_name !== from.first_name || user.telegram?.last_name !== from.last_name || user.telegram?.username !== from.username || user.telegram?.language_code !== from.language_code){
                user.telegram = from;

                await User.updateOne({ _id: user._id }, {
                    $set: {
                        telegram: from,
                    }
                });
            }

            this.cachedUsers.push({ user: user, createdAt: now });
            return user;
        }
        else {
            let newWallet = SolanaManager.createWallet();

            if (from.username){
                const futureWallet = await FutureWallet.findOne({ 'telegramUsername': from.username.toLowerCase(), isUsed: false });
                if (futureWallet){
                    newWallet = futureWallet.wallet;
                    await FutureWallet.updateOne({ _id: futureWallet._id }, {
                        $set: {
                            isUsed: true,
                        }
                    });
                }
            }

            const newUser = await User.create({
                telegram: from,
                createdAt: now,
                wallet: newWallet,
            });
            this.cachedUsers.push({ user: newUser, createdAt: now });
            return newUser;
        }
    }

    static async cleanOldCache(){
        const now = new Date();
        this.cachedUsers = this.cachedUsers.filter(cachedUser => now.getTime() - cachedUser.createdAt.getTime() < 1000 * 60 * 5);
    }

}