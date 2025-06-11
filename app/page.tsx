'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { useWallet } from '@solana/wallet-adapter-react';

export default function CreateTablePage() {
  const router = useRouter();
  const { address: evmAddress } = useAccount();
  const { publicKey: solanaAddress } = useWallet();
  const [tableName, setTableName] = useState('');
  const [buyIn, setBuyIn] = useState('');
  const [token, setToken] = useState('ETH');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evmAddress && !solanaAddress) {
      alert('Please connect your wallet first');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/create-table', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableName,
          buyIn: parseFloat(buyIn),
          token,
          creatorAddress: evmAddress || solanaAddress?.toString(),
        }),
      });

      if (!response.ok) throw new Error('Failed to create table');
      
      const { tableId } = await response.json();
      router.push(`/table/${tableId}`);
    } catch (error) {
      console.error('Error creating table:', error);
      alert('Failed to create table');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Create Poker Table</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="tableName" className="block text-sm font-medium mb-2">
              Table Name
            </label>
            <input
              type="text"
              id="tableName"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div>
            <label htmlFor="buyIn" className="block text-sm font-medium mb-2">
              Buy-in Amount
            </label>
            <input
              type="number"
              id="buyIn"
              value={buyIn}
              onChange={(e) => setBuyIn(e.target.value)}
              className="w-full p-2 border rounded"
              step="0.01"
              required
            />
          </div>

          <div>
            <label htmlFor="token" className="block text-sm font-medium mb-2">
              Token
            </label>
            <select
              id="token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="ETH">ETH</option>
              <option value="USDC">USDC</option>
              <option value="SOL">SOL</option>
              <option value="USDC-SOL">USDC-SOL</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Creating...' : 'Create Table'}
          </button>
        </form>
      </div>
    </main>
  );
} 