import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { deployContract } from 'viem/contract';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import { getContract, createPublicClient, http } from 'viem';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const account = privateKeyToAccount(process.env.PRIVATE_KEY!);
const client = createPublicClient({
  chain: sepolia,
  transport: http(process.env.SEPOLIA_RPC_URL),
});

export async function POST(request: Request) {
  try {
    const { tableName, buyIn, token, creatorAddress } = await request.json();

    // Deploy Escrow contract
    const hash = await deployContract(client, {
      account,
      abi: [], // TODO: Add contract ABI
      bytecode: '', // TODO: Add contract bytecode
      args: [token, buyIn],
    });

    const receipt = await client.waitForTransactionReceipt({ hash });
    const escrowAddress = receipt.contractAddress;

    // Create table in Supabase
    const { data, error } = await supabase
      .from('games')
      .insert([
        {
          name: tableName,
          buy_in: buyIn,
          token,
          creator_address: creatorAddress,
          escrow_address: escrowAddress,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ tableId: data.id });
  } catch (error) {
    console.error('Error creating table:', error);
    return NextResponse.json(
      { error: 'Failed to create table' },
      { status: 500 }
    );
  }
} 