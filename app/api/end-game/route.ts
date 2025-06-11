import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createPublicClient, http, parseEther } from 'viem';
import { sepolia } from 'viem/chains';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const client = createPublicClient({
  chain: sepolia,
  transport: http(process.env.SEPOLIA_RPC_URL),
});

export async function POST(request: Request) {
  try {
    const { tableId, winners, shares } = await request.json();

    // Get table data
    const { data: table, error: tableError } = await supabase
      .from('games')
      .select('*')
      .eq('id', tableId)
      .single();

    if (tableError) throw tableError;

    // Call endGame on contract
    const hash = await client.writeContract({
      address: table.escrow_address,
      abi: [], // TODO: Add contract ABI
      functionName: 'endGame',
      args: [winners, shares],
    });

    await client.waitForTransactionReceipt({ hash });

    // Update game status in Supabase
    const { error: updateError } = await supabase
      .from('games')
      .update({ status: 'ended' })
      .eq('id', tableId);

    if (updateError) throw updateError;

    // Update leaderboard
    for (let i = 0; i < winners.length; i++) {
      const { error: leaderboardError } = await supabase
        .from('player_stats')
        .upsert({
          wallet_address: winners[i],
          games_played: 1,
          total_profit: parseEther(shares[i].toString()),
        }, {
          onConflict: 'wallet_address',
        });

      if (leaderboardError) throw leaderboardError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error ending game:', error);
    return NextResponse.json(
      { error: 'Failed to end game' },
      { status: 500 }
    );
  }
} 