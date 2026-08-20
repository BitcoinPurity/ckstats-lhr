type RpcResponse<T> = {
  result: T;
  error: null | {
    code: number;
    message: string;
  };
  id: string;
};

let rpcId = 0;

export async function purityRpc<T>(
  method: string,
  params: unknown[] = []
): Promise<T> {
  const url = process.env.PURITY_RPC_URL;
  const user = process.env.PURITY_RPC_USER;
  const pass = process.env.PURITY_RPC_PASS;

  if (!url || !user || !pass) {
    throw new Error('Bitcoin Purity RPC is not configured');
  }

  const auth = Buffer.from(`${user}:${pass}`).toString('base64');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '1.0',
      id: `ckstats-${++rpcId}`,
      method,
      params,
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Purity RPC HTTP ${response.status}`);
  }

  const json = (await response.json()) as RpcResponse<T>;

  if (json.error) {
    throw new Error(`Purity RPC ${json.error.code}: ${json.error.message}`);
  }

  return json.result;
}
