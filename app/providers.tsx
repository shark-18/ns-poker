'use client';

import { getDefaultWallets, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import { useState } from 'react';

require('@solana/wallet-adapter-react-ui/styles.css');

const { wallets } = getDefaultWallets({
  appName: 'NS Poker App',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID!,
  chains: [sepolia],
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  const [solanaNetwork] = useState(WalletAdapterNetwork.Mainnet);
  const [solanaEndpoint] = useState(clusterApiUrl(solanaNetwork));
  const solanaWallets = [new PhantomWalletAdapter()];

  return (
    <WagmiProvider config={{ chains: [sepolia], wallets }}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <ConnectionProvider endpoint={solanaEndpoint}>
            <WalletProvider wallets={solanaWallets} autoConnect>
              <WalletModalProvider>
                {children}
              </WalletModalProvider>
            </WalletProvider>
          </ConnectionProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
} 