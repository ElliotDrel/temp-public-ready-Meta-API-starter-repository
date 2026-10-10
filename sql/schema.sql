-- Educational schema sketch for PostgreSQL 14+. Not a production migration.
-- All reads/writes MUST be account-owner authorized at the API/DB level.
-- If exposed through PostgREST/Supabase, configure RLS before granting access.
-- Store tokens in a dedicated secret store; `secret_ref` is an opaque pointer.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE social_accounts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id text NOT NULL,
    provider text NOT NULL CHECK (provider IN ('INSTAGRAM_LOGIN','INSTAGRAM_FACEBOOK_LOGIN','FACEBOOK_PAGE')),
    provider_account_id text NOT NULL,
    display_name text,
    token_secret_ref text NOT NULL,
    token_expires_at timestamptz,
    reconnect_required boolean NOT NULL DEFAULT false,
    connected_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (provider, provider_account_id, owner_user_id)
);

CREATE TABLE social_drafts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id uuid NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
    caption text NOT NULL,
    media_public_url text NOT NULL,
    media_kind text NOT NULL CHECK (media_kind IN ('IMAGE','REEL','CAROUSEL','STORY')),
    approved_by text,
    approved_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE publish_jobs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id uuid NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
    draft_id uuid NOT NULL REFERENCES social_drafts(id) ON DELETE CASCADE,
    idempotency_key text NOT NULL,
    scheduled_at timestamptz NOT NULL,
    status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN
      ('DRAFT','SCHEDULED','CLAIMED','CONTAINER_CREATED','READY','PUBLISHING','PUBLISHED','FAILED','CANCELLED')),
    lease_owner text,
    lease_until timestamptz,
    attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
    remote_container_id text,
    remote_media_id text,
    last_error_code text,
    last_error_summary text,
    reconciliation_required boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    published_at timestamptz,
    UNIQUE (account_id,idempotency_key)
);
CREATE INDEX publish_jobs_due_idx ON publish_jobs (scheduled_at)
    WHERE status = 'SCHEDULED';

-- Each claim transaction should use a stable lease_owner identifying the worker.
-- This is a SINGLE transaction statement example. Take care with crashes,
-- lease ownership, heartbeat, account serialization, and claimed stale jobs.
-- NOTE: when a worker may be in an ambiguous PUBLISHING state, never re-claim
-- it as SCHEDULED without first reconciling the remote publish result.
-- BEGIN;
-- WITH due_job AS (
--   SELECT id FROM publish_jobs
--   WHERE status='SCHEDULED' AND scheduled_at <= now()
--   ORDER BY scheduled_at
--   FOR UPDATE SKIP LOCKED LIMIT 1
-- )
-- UPDATE publish_jobs j SET status='CLAIMED', lease_owner=:worker_id,
--   lease_until=now()+interval '90 seconds', attempts=attempts+1, updated_at=now()
-- FROM due_job WHERE j.id=due_job.id RETURNING j.*;
-- COMMIT;

CREATE TABLE publish_attempts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id uuid NOT NULL REFERENCES publish_jobs(id) ON DELETE CASCADE,
    attempt_no integer NOT NULL,
    stage text NOT NULL,
    http_status integer,
    graph_error_code text,
    error_summary text, -- NEVER store URLs containing access_token or raw response headers.
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (job_id,attempt_no,stage)
);

CREATE TABLE instagram_comment_rules (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id uuid NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
    ig_media_id text NOT NULL,
    keywords text[] NOT NULL,
    public_reply_templates text[] NOT NULL DEFAULT '{}',
    private_reply_text text,
    private_reply_link text,
    active boolean NOT NULL DEFAULT true,
    UNIQUE (account_id,ig_media_id)
);

CREATE TABLE instagram_comment_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id uuid NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
    ig_comment_id text NOT NULL,
    ig_media_id text,
    comment_text text, -- minimize PII retention; consider omitting full text.
    matched_rule_id uuid REFERENCES instagram_comment_rules(id) ON DELETE SET NULL,
    received_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (account_id,ig_comment_id)
);

CREATE TABLE instagram_comment_actions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id uuid NOT NULL REFERENCES instagram_comment_events(id) ON DELETE CASCADE,
    kind text NOT NULL CHECK (kind IN ('PUBLIC_REPLY','PRIVATE_REPLY')),
    status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','SENDING','SENT','SKIPPED','FAILED')),
    remote_message_id text,
    attempt_count integer NOT NULL DEFAULT 0,
    error_summary text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (event_id,kind)
);

CREATE TABLE instagram_media_snapshots (
    account_id uuid NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
    ig_media_id text NOT NULL,
    snapshot_at timestamptz NOT NULL,
    parsed_metrics jsonb NOT NULL DEFAULT '{}',
    raw_graph_payload jsonb NOT NULL DEFAULT '{}',
    PRIMARY KEY (account_id,ig_media_id,snapshot_at)
);

CREATE TABLE instagram_account_snapshots (
    account_id uuid NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
    period text NOT NULL,
    window_start timestamptz NOT NULL,
    window_end timestamptz NOT NULL,
    parsed_metrics jsonb NOT NULL DEFAULT '{}',
    raw_graph_payload jsonb NOT NULL DEFAULT '{}',
    captured_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (account_id,period,window_start,window_end)
);

CREATE TABLE incoming_webhook_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_event_key text NOT NULL UNIQUE,
    event_type text NOT NULL,
    processed_at timestamptz,
    received_at timestamptz NOT NULL DEFAULT now(),
    last_error_summary text
);

-- Recommended: create an append-only status-change log, partition old insights,
-- retention policy for comment PII, and account-specific RLS policies.
