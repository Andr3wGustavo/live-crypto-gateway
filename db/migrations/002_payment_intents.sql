BEGIN;
CREATE TABLE IF NOT EXISTS Payment_Intents (
  id UUID PRIMARY KEY,
  access_hash CHAR(64) NOT NULL,
  streamer_id INT NOT NULL REFERENCES Streamers(id),
  chain_id VARCHAR(50) NOT NULL,
  sender_address VARCHAR(255) NOT NULL,
  recipient_address VARCHAR(255) NOT NULL,
  gross_amount NUMERIC(78,18) NOT NULL CHECK (gross_amount > 0),
  currency VARCHAR(50) NOT NULL,
  memo VARCHAR(64) NOT NULL UNIQUE,
  reference_address VARCHAR(64),
  router_address VARCHAR(255),
  treasury_address VARCHAR(255),
  fee_bps INT NOT NULL CHECK (fee_bps BETWEEN 0 AND 1000),
  confirmations INT NOT NULL CHECK (confirmations > 0),
  tx_hash VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'CREATED' CHECK (status IN ('CREATED','SUBMITTED','CONFIRMED','EXPIRED')),
  scan_block BIGINT,
  scan_before VARCHAR(100),
  attempts INT NOT NULL DEFAULT 0,
  last_error VARCHAR(64),
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '30 minutes',
  monitor_until TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days'
);
CREATE INDEX IF NOT EXISTS payment_intents_pending ON Payment_Intents(next_attempt_at) WHERE status <> 'CONFIRMED';

ALTER TABLE Transactions ADD COLUMN IF NOT EXISTS chain_id VARCHAR(50) NOT NULL DEFAULT 'legacy';
ALTER TABLE Transactions ADD COLUMN IF NOT EXISTS intent_id UUID UNIQUE REFERENCES Payment_Intents(id);
ALTER TABLE Transactions ADD COLUMN IF NOT EXISTS gross_amount NUMERIC(78,18);
ALTER TABLE Transactions ADD COLUMN IF NOT EXISTS platform_fee NUMERIC(78,18);
ALTER TABLE Transactions ADD COLUMN IF NOT EXISTS recipient_address VARCHAR(255);
ALTER TABLE Donation_Outbox ADD COLUMN IF NOT EXISTS chain_id VARCHAR(50) NOT NULL DEFAULT 'legacy';
ALTER TABLE Donation_Outbox ADD COLUMN IF NOT EXISTS event_id BIGSERIAL UNIQUE;
ALTER TABLE Donation_Outbox ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMPTZ;
ALTER TABLE Donation_Outbox DROP CONSTRAINT IF EXISTS donation_outbox_tx_hash_fkey;
ALTER TABLE Donation_Outbox DROP CONSTRAINT IF EXISTS donation_outbox_chain_id_tx_hash_fkey;
ALTER TABLE Transactions DROP CONSTRAINT IF EXISTS transactions_pkey;
ALTER TABLE Transactions ADD PRIMARY KEY (chain_id, tx_hash);
ALTER TABLE Donation_Outbox DROP CONSTRAINT IF EXISTS donation_outbox_pkey;
ALTER TABLE Donation_Outbox ADD PRIMARY KEY (chain_id, tx_hash);
ALTER TABLE Donation_Outbox ADD FOREIGN KEY (chain_id, tx_hash) REFERENCES Transactions(chain_id, tx_hash);
-- Legacy rows were marked delivered without an OBS acknowledgement. Do not
-- suddenly replay historical broadcasts after this migration.
UPDATE Donation_Outbox SET acknowledged_at = delivered_at WHERE chain_id = 'legacy' AND delivered_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS donation_outbox_replay ON Donation_Outbox(streamer_id, event_id) WHERE acknowledged_at IS NULL;

ALTER TABLE Alert_Configs ADD COLUMN IF NOT EXISTS position VARCHAR(30) NOT NULL DEFAULT 'bottom-center';
ALTER TABLE Alert_Configs ADD COLUMN IF NOT EXISTS sound_preset VARCHAR(40) NOT NULL DEFAULT 'arcade_coin';
ALTER TABLE Alert_Configs ADD COLUMN IF NOT EXISTS voice_profile VARCHAR(40) NOT NULL DEFAULT 'cyber_announcer';
ALTER TABLE Alert_Configs ADD COLUMN IF NOT EXISTS show_leaderboard BOOLEAN NOT NULL DEFAULT true;
CREATE TABLE IF NOT EXISTS Alert_Consumers (
  streamer_id INT PRIMARY KEY REFERENCES Streamers(id) ON DELETE CASCADE,
  owner UUID NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);
COMMIT;
