export class ExplorerManager {

    static getUrlToAddress(address: string): string {
        return `https://solscan.io/address/${address}?cluster=custom&customUrl=https%3A%2F%2Frpc.testnet.soo.network%2Frpc`;
    }

    static getUrlToTransaction(signature: string): string {
        return `https://solscan.io/tx/${signature}?cluster=custom&customUrl=https%3A%2F%2Frpc.testnet.soo.network%2Frpc`;
    }
    
}