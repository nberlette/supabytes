-- Create the files storage bucket
INSERT INTO
  STORAGE.buckets (id, name, public)
VALUES
  ('files', 'files', false) ON CONFLICT (id) DO NOTHING;

-- Storage policies for the files bucket
CREATE POLICY "Users can upload their own files" ON STORAGE.objects FOR
INSERT
  WITH CHECK (
    bucket_id = 'files'
    AND auth.uid()::text = (STORAGE.foldername(name)) [1]
  );

CREATE POLICY "Users can view their own files" ON STORAGE.objects FOR
SELECT
  USING (
    bucket_id = 'files'
    AND auth.uid()::text = (STORAGE.foldername(name)) [1]
  );

CREATE POLICY "Users can update their own files" ON STORAGE.objects FOR
UPDATE
  USING (
    bucket_id = 'files'
    AND auth.uid()::text = (STORAGE.foldername(name)) [1]
  );

CREATE POLICY "Users can delete their own files" ON STORAGE.objects FOR DELETE USING (
  bucket_id = 'files'
  AND auth.uid()::text = (STORAGE.foldername(name)) [1]
);
