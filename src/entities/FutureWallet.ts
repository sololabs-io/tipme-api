import * as mongoose from 'mongoose';
import { WalletModel } from '../services/solana/types';

export let Schema = mongoose.Schema;
export let ObjectId = mongoose.Schema.Types.ObjectId;
export let Mixed = mongoose.Schema.Types.Mixed;

export interface IFutureWallet extends mongoose.Document {
    telegramUsername: string;
    wallet: WalletModel;
    isUsed: boolean;

    updatedAt?: Date;
    createdAt: Date;
}

export const FutureWalletSchema = new mongoose.Schema<IFutureWallet>({
    telegramUsername: { type: String },
    wallet: { type: Mixed },
    isUsed: { type: Boolean },

    updatedAt: { type: Date, default: new Date() },
    createdAt: { type: Date, default: new Date() }
});

FutureWalletSchema.index({ telegramUsername: 1, isUsed: 1 });

FutureWalletSchema.pre('save', function (next) {
    this.updatedAt = new Date();

    return next();
});

export const FutureWallet = mongoose.model<IFutureWallet>('future-wallets', FutureWalletSchema);