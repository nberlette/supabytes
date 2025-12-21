-- Create folders table
CREATE TABLE IF NOT EXISTS folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  parent_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create files table
CREATE TABLE IF NOT EXISTS files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  size BIGINT NOT NULL DEFAULT 0,
  mime_type TEXT,
  folder_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create shared_links table for public sharing
CREATE TABLE IF NOT EXISTS shared_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);

CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON folders(parent_id);

CREATE INDEX IF NOT EXISTS idx_files_user_id ON files(user_id);

CREATE INDEX IF NOT EXISTS idx_files_folder_id ON files(folder_id);

CREATE INDEX IF NOT EXISTS idx_shared_links_token ON shared_links(token);

-- Enable RLS on all tables
ALTER TABLE
  folders ENABLE ROW LEVEL SECURITY;

ALTER TABLE
  files ENABLE ROW LEVEL SECURITY;

ALTER TABLE
  shared_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies for folders
CREATE POLICY "Users can view their own folders" ON folders FOR
SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own folders" ON folders FOR
INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own folders" ON folders FOR
UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own folders" ON folders FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for files
CREATE POLICY "Users can view their own files" ON files FOR
SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own files" ON files FOR
INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own files" ON files FOR
UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own files" ON files FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for shared_links
CREATE POLICY "Users can view shared links for their files" ON shared_links FOR
SELECT
  USING (
    EXISTS (
      SELECT
        1
      FROM
        files
      WHERE
        files.id = shared_links.file_id
        AND files.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create shared links for their files" ON shared_links FOR
INSERT
  WITH CHECK (
    EXISTS (
      SELECT
        1
      FROM
        files
      WHERE
        files.id = file_id
        AND files.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete shared links for their files" ON shared_links FOR DELETE USING (
  EXISTS (
    SELECT
      1
    FROM
      files
    WHERE
      files.id = shared_links.file_id
      AND files.user_id = auth.uid()
  )
);

-- Allow public access to shared links for download
CREATE POLICY "Anyone can view shared links by token" ON shared_links FOR
SELECT
  USING (TRUE);
