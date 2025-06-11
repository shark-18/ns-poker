-- Create tables
CREATE TABLE games (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    buy_in DECIMAL NOT NULL,
    token TEXT NOT NULL,
    creator_address TEXT NOT NULL,
    escrow_address TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE deposits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    game_id UUID REFERENCES games(id) NOT NULL,
    player_address TEXT NOT NULL,
    amount DECIMAL NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE wallet_links (
    telegram_id BIGINT PRIMARY KEY,
    wallet_address TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE player_stats (
    wallet_address TEXT PRIMARY KEY,
    games_played INTEGER DEFAULT 0,
    total_profit DECIMAL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create leaderboard view
CREATE VIEW leaderboard_view AS
SELECT 
    wl.telegram_id,
    ps.total_profit,
    ps.games_played
FROM player_stats ps
JOIN wallet_links wl ON ps.wallet_address = wl.wallet_address
ORDER BY ps.total_profit DESC;

-- Create indexes
CREATE INDEX idx_games_creator ON games(creator_address);
CREATE INDEX idx_deposits_game ON deposits(game_id);
CREATE INDEX idx_deposits_player ON deposits(player_address);
CREATE INDEX idx_wallet_links_address ON wallet_links(wallet_address);

-- Enable Row Level Security
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Games are viewable by everyone"
    ON games FOR SELECT
    USING (true);

CREATE POLICY "Deposits are viewable by everyone"
    ON deposits FOR SELECT
    USING (true);

CREATE POLICY "Wallet links are viewable by owner"
    ON wallet_links FOR SELECT
    USING (telegram_id = auth.uid());

CREATE POLICY "Player stats are viewable by everyone"
    ON player_stats FOR SELECT
    USING (true);

-- Create functions
CREATE OR REPLACE FUNCTION update_player_stats()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO player_stats (wallet_address, games_played, total_profit)
    VALUES (NEW.player_address, 1, NEW.amount)
    ON CONFLICT (wallet_address) DO UPDATE
    SET 
        games_played = player_stats.games_played + 1,
        total_profit = player_stats.total_profit + NEW.amount,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER on_deposit
    AFTER INSERT ON deposits
    FOR EACH ROW
    EXECUTE FUNCTION update_player_stats(); 