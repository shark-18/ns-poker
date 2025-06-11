import { Bot, session } from 'grammy';
import { createClient } from '@supabase/supabase-js';
import { ethers } from 'ethers';

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN!);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Store nonces for wallet verification
const nonces = new Map<number, string>();

bot.use(session());

// /start command
bot.command('start', async (ctx) => {
  await ctx.reply(
    'Welcome to NS Poker Bot! Use /link to connect your wallet.'
  );
});

// /link command
bot.command('link', async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId) return;

  // Generate random nonce
  const nonce = ethers.utils.randomBytes(32).toString('hex');
  nonces.set(userId, nonce);

  await ctx.reply(
    `To link your wallet, sign this message with your wallet:\n\n${nonce}\n\nAfter signing, send the signature here.`
  );
});

// Handle signature messages
bot.on('message:text', async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId) return;

  const nonce = nonces.get(userId);
  if (!nonce) return;

  const signature = ctx.message.text;
  try {
    // Verify signature and recover address
    const address = ethers.utils.verifyMessage(nonce, signature);

    // Store wallet link in Supabase
    const { error } = await supabase
      .from('wallet_links')
      .upsert({
        telegram_id: userId,
        wallet_address: address,
      });

    if (error) throw error;

    await ctx.reply('Wallet linked successfully!');
    nonces.delete(userId);
  } catch (error) {
    await ctx.reply('Invalid signature. Please try again.');
  }
});

// /leaderboard command
bot.command('leaderboard', async (ctx) => {
  try {
    const { data, error } = await supabase
      .from('leaderboard_view')
      .select('*')
      .order('total_profit', { ascending: false })
      .limit(10);

    if (error) throw error;

    const message = data
      .map(
        (entry, index) =>
          `${index + 1}. @${entry.telegram_handle}: ${entry.total_profit.toFixed(
            2
          )} (${entry.games_played} games)`
      )
      .join('\n');

    await ctx.reply(`🏆 Weekly Leaderboard:\n\n${message}`);
  } catch (error) {
    await ctx.reply('Failed to fetch leaderboard.');
  }
});

// Start the bot
bot.start(); 