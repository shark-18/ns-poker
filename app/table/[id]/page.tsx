'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAccount } from 'wagmi';
import { useWallet } from '@solana/wallet-adapter-react';
import { QRCodeSVG } from 'qrcode.react';
import { io } from 'socket.io-client';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface TableData {
  id: string;
  name: string;
  buyIn: number;
  token: string;
  creatorAddress: string;
  escrowAddress: string;
}

interface Seat {
  position: number;
  address: string | null;
  isHost: boolean;
}

export default function TablePage() {
  const params = useParams();
  const { address: evmAddress } = useAccount();
  const { publicKey: solanaAddress } = useWallet();
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [seats, setSeats] = useState<Seat[]>(Array(10).fill(null).map((_, i) => ({ position: i, address: null, isHost: false })));
  const [isHost, setIsHost] = useState(false);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [winners, setWinners] = useState<{ address: string; share: number }[]>([]);

  useEffect(() => {
    const fetchTableData = async () => {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('id', params.id)
        .single();

      if (error) {
        console.error('Error fetching table:', error);
        return;
      }

      setTableData(data);
      setIsHost(data.creatorAddress === (evmAddress || solanaAddress?.toString()));
    };

    fetchTableData();

    // Socket.io connection for real-time updates
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!);
    socket.emit('join-table', params.id);

    socket.on('seat-update', (updatedSeats: Seat[]) => {
      setSeats(updatedSeats);
    });

    return () => {
      socket.disconnect();
    };
  }, [params.id, evmAddress, solanaAddress]);

  const generatePaymentLink = () => {
    if (!tableData) return '';
    
    if (tableData.token === 'ETH' || tableData.token === 'USDC') {
      // EIP-681 link for EVM tokens
      return `ethereum:${tableData.escrowAddress}/transfer?address=${tableData.token}&uint256=${tableData.buyIn}`;
    } else {
      // Solana payment URL
      return `solana:${tableData.escrowAddress}?amount=${tableData.buyIn}`;
    }
  };

  const handleEndGame = async () => {
    if (!tableData || winners.length === 0) return;

    try {
      const response = await fetch('/api/end-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableId: tableData.id,
          winners: winners.map(w => w.address),
          shares: winners.map(w => w.share),
        }),
      });

      if (!response.ok) throw new Error('Failed to end game');
      
      setShowWinnerModal(false);
      // Handle success (e.g., show confirmation, redirect)
    } catch (error) {
      console.error('Error ending game:', error);
      alert('Failed to end game');
    }
  };

  if (!tableData) return <div>Loading...</div>;

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">{tableData.name}</h1>
        
        <div className="grid grid-cols-2 gap-8">
          {/* Seat Chart */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-2xl font-semibold mb-4">Seats</h2>
            <div className="grid grid-cols-2 gap-4">
              {seats.map((seat) => (
                <div
                  key={seat.position}
                  className={`p-4 border rounded ${
                    seat.address ? 'bg-green-50' : 'bg-gray-50'
                  }`}
                >
                  <p className="font-medium">Seat {seat.position + 1}</p>
                  <p className="text-sm text-gray-600">
                    {seat.address || 'Empty'}
                  </p>
                  {seat.isHost && (
                    <span className="text-xs text-blue-600">Host</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* QR Code */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-2xl font-semibold mb-4">Join Table</h2>
            <div className="flex flex-col items-center">
              <QRCodeSVG value={generatePaymentLink()} size={200} />
              <p className="mt-4 text-sm text-gray-600">
                Scan to join with {tableData.token}
              </p>
            </div>
          </div>
        </div>

        {/* Host Controls */}
        {isHost && (
          <div className="mt-8">
            <button
              onClick={() => setShowWinnerModal(true)}
              className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
            >
              Assign Winners
            </button>
          </div>
        )}

        {/* Winner Modal */}
        {showWinnerModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg w-96">
              <h3 className="text-xl font-semibold mb-4">Assign Winners</h3>
              {seats.map((seat) => (
                seat.address && (
                  <div key={seat.position} className="mb-4">
                    <label className="block text-sm font-medium mb-2">
                      {seat.address}
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="Share %"
                      className="w-full p-2 border rounded"
                      onChange={(e) => {
                        const share = parseInt(e.target.value);
                        setWinners(prev => {
                          const filtered = prev.filter(w => w.address !== seat.address);
                          return [...filtered, { address: seat.address!, share }];
                        });
                      }}
                    />
                  </div>
                )
              ))}
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={() => setShowWinnerModal(false)}
                  className="px-4 py-2 border rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEndGame}
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                  End Game
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
} 