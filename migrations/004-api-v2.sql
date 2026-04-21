ALTER TABLE
  shared_links
ADD
  COLUMN IF NOT EXISTS folder_id UUID REFERENCES folders(id) ON DELETE CASCADE,
ADD
  COLUMN IF NOT EXISTS target_type TEXT,
ADD
  COLUMN IF NOT EXISTS short_token TEXT;

ALTER TABLE
  shared_links
ALTER COLUMN
  file_id DROP NOT NULL;

UPDATE shared_links
SET
  target_type = COALESCE(target_type, 'file'),
  short_token = COALESCE(short_token, SUBSTRING(REPLACE(id::text, '-', '') FROM 1 FOR 8))
WHERE
  target_type IS NULL
  OR short_token IS NULL;

CREATE INDEX IF NOT EXISTS idx_shared_links_folder_id ON shared_links(folder_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_shared_links_short_token ON shared_links(short_token);

CREATE UNIQUE INDEX IF NOT EXISTS idx_folders_user_parent_name_active ON folders(
  user_id,
  COALESCE(parent_id, '00000000-0000-0000-0000-000000000000'::uuid),
  name
)
WHERE
  is_trashed = FALSE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_files_user_folder_name_active ON files(
  user_id,
  COALESCE(folder_id, '00000000-0000-0000-0000-000000000000'::uuid),
  name
)
WHERE
  is_trashed = FALSE;
