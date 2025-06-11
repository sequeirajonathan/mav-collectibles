-- Create installers table
CREATE TABLE IF NOT EXISTS installers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('file', 'drive_link')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create RLS policies
ALTER TABLE installers ENABLE ROW LEVEL SECURITY;

-- Allow admins to do everything
CREATE POLICY "Admins can do everything" ON installers
    FOR ALL
    TO authenticated
    USING (
        auth.jwt() ->> 'role' = 'admin'
    );

-- Allow users to view installers
CREATE POLICY "Users can view installers" ON installers
    FOR SELECT
    TO authenticated
    USING (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_installers_updated_at
    BEFORE UPDATE ON installers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 