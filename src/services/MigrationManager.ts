import { RpcManager } from "./solana/RpcManager";

export class MigrationManager {

    static async migrate() {


        console.log('MigrationManager', 'migrate', 'start');
        const chatId = 862473;

        await RpcManager.getAssetsByOwner('9Xt9Zj9HoAh13MpoB6hmY9UZz37L4Jabtyn8zE7AAsL');

        console.log('MigrationManager', 'migrate', 'done');
    }

}