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
  target_type = 'file',
  short_token = SUBSTRING(REPLACE(gen_random_uuid()::text, '-', '') FROM 1 FOR 8)
WHERE
  target_type IS NULL
  OR short_token IS NULL;

ALTER TABLE
  shared_links
ALTER COLUMN
  target_type SET NOT NULL,
ALTER COLUMN
  short_token SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT
      1
    FROM
      pg_constraint
    WHERE
      conname = 'shared_links_target_type_check'
  ) THEN
    ALTER TABLE
      shared_links
    ADD CONSTRAINT shared_links_target_type_check CHECK (
      target_type IN ('file', 'folder')
    );
  END IF;
END $$;

DROP POLICY IF EXISTS "Users can view shared links for their files" ON shared_links;

DROP POLICY IF EXISTS "Users can create shared links for their files" ON shared_links;

DROP POLICY IF EXISTS "Users can delete shared links for their files" ON shared_links;

DROP POLICY IF EXISTS "Anyone can view shared links by token" ON shared_links;

CREATE POLICY "Users can view shared links for their resources" ON shared_links FOR
SELECT
  USING (
    (
      target_type = 'file'
      AND file_id IS NOT NULL
      AND EXISTS (
        SELECT
          1
        FROM
          files
        WHERE
          files.id = shared_links.file_id
          AND files.user_id = auth.uid()
      )
    )
    OR (
      target_type = 'folder'
      AND folder_id IS NOT NULL
      AND EXISTS (
        SELECT
          1
        FROM
          folders
        WHERE
          folders.id = shared_links.folder_id
          AND folders.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create shared links for their resources" ON shared_links FOR
INSERT
  WITH CHECK (
    (
      target_type = 'file'
      AND file_id IS NOT NULL
      AND folder_id IS NULL
      AND EXISTS (
        SELECT
          1
        FROM
          files
        WHERE
          files.id = file_id
          AND files.user_id = auth.uid()
      )
    )
    OR (
      target_type = 'folder'
      AND folder_id IS NOT NULL
      AND file_id IS NULL
      AND EXISTS (
        SELECT
          1
        FROM
          folders
        WHERE
          folders.id = folder_id
          AND folders.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete shared links for their resources" ON shared_links FOR DELETE USING (
  (
    target_type = 'file'
    AND file_id IS NOT NULL
    AND EXISTS (
      SELECT
        1
      FROM
        files
      WHERE
        files.id = shared_links.file_id
        AND files.user_id = auth.uid()
    )
  )
  OR (
    target_type = 'folder'
    AND folder_id IS NOT NULL
    AND EXISTS (
      SELECT
        1
      FROM
        folders
      WHERE
        folders.id = shared_links.folder_id
        AND folders.user_id = auth.uid()
    )
  )
);

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
