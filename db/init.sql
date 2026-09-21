CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE Streamers (
    id SERIAL PRIMARY KEY,
    public_address VARCHAR(255) UNIQUE NOT NULL,
    obs_token UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL
);

CREATE TABLE Wallets (
    id SERIAL PRIMARY KEY,
    streamer_id INT NOT NULL REFERENCES Streamers(id) ON DELETE CASCADE,
    chain_id VARCHAR(50) NOT NULL,
    public_address VARCHAR(255) NOT NULL,
    UNIQUE(streamer_id, chain_id)
);

CREATE TABLE Alert_Configs (
    id SERIAL PRIMARY KEY,
    streamer_id INT UNIQUE NOT NULL REFERENCES Streamers(id) ON DELETE CASCADE,
    min_amount DECIMAL(18,8) NOT NULL DEFAULT 0.0,
    media_url VARCHAR(2048),
    audio_url VARCHAR(2048),
    active_theme VARCHAR(50) NOT NULL DEFAULT 'cyberpunk',
    goal_amount DECIMAL(18,8) NOT NULL DEFAULT 0.0,
    goal_current DECIMAL(18,8) NOT NULL DEFAULT 0.0,
    goal_title VARCHAR(255) NOT NULL DEFAULT 'Donation Goal'
);

CREATE TABLE Transactions (
    tx_hash VARCHAR(255) PRIMARY KEY,
    streamer_id INT NOT NULL REFERENCES Streamers(id) ON DELETE CASCADE,
    sender_address VARCHAR(255) NOT NULL,
    amount NUMERIC(78,18) NOT NULL,
    currency VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Donation_Outbox (
    tx_hash VARCHAR(255) PRIMARY KEY REFERENCES Transactions(tx_hash),
    streamer_id INT NOT NULL REFERENCES Streamers(id) ON DELETE CASCADE,
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    locked_until TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ
);
CREATE INDEX donation_outbox_pending ON Donation_Outbox(created_at) WHERE delivered_at IS NULL;
