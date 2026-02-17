-- Create storage bucket for badges
INSERT INTO storage.buckets (id, name, public) 
VALUES ('badges', 'badges', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for badges bucket
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'badges' );

CREATE POLICY "Teachers can upload badges"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'badges' AND
    (storage.foldername(name))[1] != 'private'
);

CREATE POLICY "Teachers can update badges"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'badges' )
WITH CHECK ( bucket_id = 'badges' );

CREATE POLICY "Teachers can delete badges"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'badges' );
