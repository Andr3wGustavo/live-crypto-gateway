-- Apply once to existing installations; also safe to rerun.
BEGIN;
ALTER TABLE Transactions ALTER COLUMN amount TYPE NUMERIC(78,18);
CREATE TABLE IF NOT EXISTS Donation_Outbox (
  tx_hash VARCHAR(255) PRIMARY KEY REFERENCES Transactions(tx_hash),
  streamer_id INT NOT NULL REFERENCES Streamers(id) ON DELETE CASCADE,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  locked_until TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS donation_outbox_pending ON Donation_Outbox(created_at) WHERE delivered_at IS NULL;
COMMIT;
