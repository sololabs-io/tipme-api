import {
  ConfirmedSignaturesForAddress2Options,
  Connection,
  ConnectionConfig,
  ParsedTransactionWithMeta,
  PublicKey,
} from "@solana/web3.js";

export const maxSupportedTransactionVersion = 2;

export function newConnection(fixedRpc?: string): Connection {
  const config: ConnectionConfig = {};
  if (process.env.SOLANA_RPC_KEY_SECRET) {
    config.httpHeaders = { Authorization: process.env.SOLANA_RPC_KEY_SECRET };
  }

  const rpc = fixedRpc || getRpc();
  return new Connection(rpc, config);
}

export function getRpc(): string {
    return process.env.SOLANA_RPC || "";
}

interface Opt extends ConfirmedSignaturesForAddress2Options {
  onTransaction?: (tx: ParsedTransactionWithMeta) => Promise<void>;
}

export async function fetchWeb3Transactions(
  conn: Connection,
  account: string,
  opt?: Opt
): Promise<ParsedTransactionWithMeta[] | null> {
  const signatures = await conn.getSignaturesForAddress(
    new PublicKey(account),
    {
      limit: opt?.limit,
      before: opt?.before,
      until: opt?.until,
    },
    "finalized"
  );

  if (signatures) {
    const txs: ParsedTransactionWithMeta[] = [];
    const oldestToLatest = signatures.reverse();

    for (let i = 0; i < oldestToLatest.length; i++) {
      const signature = oldestToLatest[i];
      const tx = await conn.getParsedTransaction(signature.signature, {
        commitment: "finalized",
        maxSupportedTransactionVersion,
      });
      if (!tx) {
        continue;
      }
      opt?.onTransaction && (await opt.onTransaction(tx));

      txs.push(tx);
    }
    return txs;
  }
  return null;
}
