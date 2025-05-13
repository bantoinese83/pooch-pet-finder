import { NextResponse } from "next/server"

// This is a server-side only route that serves the database schema SQL
export async function GET() {
  try {
    // In a real production app, you would store this in a more appropriate location
    // For this example, we'll return a hardcoded schema
    const schema = `
-- Pet reports table (for both lost and found pets)
CREATE TABLE IF NOT EXISTS pet_reports (
  id UUID PRIMARY KEY,
  report_type TEXT NOT NULL CHECK (report_type IN ('lost', 'found')),
  image_url TEXT NOT NULL,
  s3_key TEXT NOT NULL,
  pet_name TEXT,
  pet_type TEXT,
  breeds TEXT[] DEFAULT '{}',
  colors TEXT[] DEFAULT '{}',
  size TEXT,
  age TEXT,
  gender TEXT,
  location TEXT,
  coordinates JSONB,
  description TEXT,
  distinctive_features TEXT[] DEFAULT '{}',
  -- Fields specific to lost pets
  last_seen_date DATE,
  -- Fields specific to found pets
  day_found DATE,
  finder_name TEXT,
  finder_phone TEXT,
  finder_email TEXT,
  -- Common fields
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shelters table
CREATE TABLE IF NOT EXISTS shelters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  phone TEXT,
  email TEXT UNIQUE NOT NULL,
  website TEXT,
  description TEXT,
  coordinates JSONB,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shelter pets table with explicit foreign key
CREATE TABLE IF NOT EXISTS shelter_pets (
  id UUID PRIMARY KEY,
  shelter_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  s3_key TEXT,
  pet_type TEXT NOT NULL,
  breeds TEXT[] DEFAULT '{}',
  colors TEXT[] DEFAULT '{}',
  size TEXT,
  age TEXT,
  gender TEXT,
  name TEXT,
  description TEXT,
  found_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  found_location TEXT,
  coordinates JSONB,
  distinctive_features TEXT[] DEFAULT '{}',
  rekognition_labels JSONB,
  status TEXT DEFAULT 'available',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_shelter
    FOREIGN KEY(shelter_id)
    REFERENCES shelters(id)
    ON DELETE CASCADE
);

-- Pet matches table
CREATE TABLE IF NOT EXISTS pet_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lost_pet_id UUID NOT NULL REFERENCES pet_reports(id),
  found_pet_id UUID NOT NULL REFERENCES pet_reports(id),
  match_confidence FLOAT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pet_reports_report_type ON pet_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_pet_reports_pet_type ON pet_reports(pet_type);
CREATE INDEX IF NOT EXISTS idx_pet_reports_status ON pet_reports(status);
CREATE INDEX IF NOT EXISTS idx_pet_reports_last_seen_date ON pet_reports(last_seen_date);
CREATE INDEX IF NOT EXISTS idx_pet_reports_day_found ON pet_reports(day_found);
CREATE INDEX IF NOT EXISTS idx_shelter_pets_pet_type ON shelter_pets(pet_type);
CREATE INDEX IF NOT EXISTS idx_shelter_pets_shelter_id ON shelter_pets(shelter_id);
CREATE INDEX IF NOT EXISTS idx_shelter_pets_status ON shelter_pets(status);
CREATE INDEX IF NOT EXISTS idx_pet_matches_lost_pet_id ON pet_matches(lost_pet_id);
CREATE INDEX IF NOT EXISTS idx_pet_matches_found_pet_id ON pet_matches(found_pet_id);
CREATE INDEX IF NOT EXISTS idx_pet_matches_status ON pet_matches(status);
    `

    return new NextResponse(schema, {
      headers: {
        "Content-Type": "text/plain",
      },
    })
  } catch (error) {
    console.error("Error serving schema:", error)
    return NextResponse.json({ error: "Failed to serve schema" }, { status: 500 })
  }
}
