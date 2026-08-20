import { NextResponse } from 'next/server';

import { getPurityNetwork } from '../../../lib/purityNetwork';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const network = await getPurityNetwork();

    return NextResponse.json({
      success: true,
      ...network,
    });
  } catch (error) {
    console.error('Purity network API error:', error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown Purity RPC error',
      },
      { status: 500 }
    );
  }
}
