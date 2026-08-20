import { purityRpc } from './purityRpc';

export type PurityNetwork = {
  height: number;
  headers: number;
  bestBlockHash: string;

  tipDifficulty: number;
  nextDifficulty: number;
  nextBits: string;
  nextHeight: number;

  networkHashrate: number;
  blockTime: number;
  medianTime: number;
  blockAgeSeconds: number;
  initialBlockDownload: boolean;
};

type BlockchainInfo = {
  blocks: number;
  headers: number;
  bestblockhash: string;
  difficulty: number;
  mediantime: number;
  initialblockdownload: boolean;
};

type BlockHeader = {
  time: number;
  mediantime: number;
};

type BlockTemplate = {
  height: number;
  bits: string;
  target?: string;
  curtime: number;
  mintime: number;
};

function bitsToDifficulty(bits: string): number {
  const compact = Number.parseInt(bits, 16);
  const exponent = compact >>> 24;
  const mantissa = compact & 0x007fffff;

  if (mantissa === 0) {
    return 0;
  }

  return (0x0000ffff / mantissa) * 256 ** (0x1d - exponent);
}

export async function getPurityNetwork(): Promise<PurityNetwork> {
  const info = await purityRpc<BlockchainInfo>('getblockchaininfo');

  const header = await purityRpc<BlockHeader>('getblockheader', [
    info.bestblockhash,
    true,
  ]);

  const template = await purityRpc<BlockTemplate>('getblocktemplate', [
    {
      rules: ['segwit'],
    },
  ]);

  const networkHashrate = await purityRpc<number>(
    'getnetworkhashps',
    [120, -1]
  );

  const now = Math.floor(Date.now() / 1000);

  return {
    height: info.blocks,
    headers: info.headers,
    bestBlockHash: info.bestblockhash,

    tipDifficulty: info.difficulty,
    nextDifficulty: bitsToDifficulty(template.bits),
    nextBits: template.bits,
    nextHeight: template.height,

    networkHashrate,
    blockTime: header.time,
    medianTime: header.mediantime,
    blockAgeSeconds: Math.max(0, now - header.time),
    initialBlockDownload: info.initialblockdownload,
  };
}
