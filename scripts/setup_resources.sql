-- Timetables Array: Slots
CREATE TABLE IF NOT EXISTS public.timetable_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    day TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    subject TEXT NOT NULL,
    room TEXT NOT NULL,
    teacher TEXT NOT NULL,
    level TEXT NOT NULL,
    year TEXT,
    color TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.timetable_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.timetable_slots FOR SELECT USING (true);
CREATE POLICY "Enable all access for teachers/admins" ON public.timetable_slots FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('teacher', 'admin')
  )
);

-- Resource Array: Studios
CREATE TABLE IF NOT EXISTS public.studios (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    capacity INTEGER NOT NULL,
    equipment JSONB NOT NULL DEFAULT '[]'::jsonb,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.studios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.studios FOR SELECT USING (true);
CREATE POLICY "Enable all access for teachers/admins" ON public.studios FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('teacher', 'admin')
  )
);

-- Resource Array: Equipment
CREATE TABLE IF NOT EXISTS public.equipment (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    label TEXT,
    category TEXT NOT NULL,
    total_qty INTEGER NOT NULL DEFAULT 1,
    available_qty INTEGER NOT NULL DEFAULT 1,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.equipment FOR SELECT USING (true);
CREATE POLICY "Enable all access for teachers/admins" ON public.equipment FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('teacher', 'admin')
  )
);

-- Resource Array: Equipment Logs
CREATE TABLE IF NOT EXISTS public.equipment_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    equipment_id TEXT REFERENCES public.equipment(id) ON DELETE CASCADE,
    studio_id TEXT REFERENCES public.studios(id) ON DELETE CASCADE,
    user_id UUID,
    user_name TEXT,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    note TEXT NOT NULL,
    type TEXT NOT NULL, -- 'Usage', 'Damage', 'Maintenance'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.equipment_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.equipment_logs FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.equipment_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for teachers" ON public.equipment_logs FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('teacher', 'admin')));

-- Resource Array: Studio Bookings
CREATE TABLE IF NOT EXISTS public.studio_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    studio_id TEXT REFERENCES public.studios(id) ON DELETE CASCADE,
    user_id UUID,
    user_name TEXT NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    purpose TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.studio_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.studio_bookings FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.studio_bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for owner or teacher" ON public.studio_bookings FOR UPDATE USING (
  auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('teacher', 'admin'))
);

-- Resource Array: Equipment Loans
CREATE TABLE IF NOT EXISTS public.equipment_loans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    equipment_id TEXT REFERENCES public.equipment(id) ON DELETE CASCADE,
    user_id UUID,
    user_name TEXT NOT NULL,
    request_date TIMESTAMP WITH TIME ZONE NOT NULL,
    return_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending',
    qty INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.equipment_loans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.equipment_loans FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.equipment_loans FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for owner or teacher" ON public.equipment_loans FOR UPDATE USING (
  auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('teacher', 'admin'))
);

-- Insert Mock Data for Studios and Equipment so the UI isn't empty initially
INSERT INTO public.studios (id, name, capacity, equipment) VALUES
('studio-a', 'Studio A (Main Live Room)', 10, '["Drum Kit", "Piano", "Amps"]'),
('studio-b', 'Studio B (Vocal Booth)', 2, '["Neumann U87", "Pro Tools HD"]'),
('suite-1', 'Production Suite 1', 3, '["Mac Studio", "Logic Pro", "Ableton"]')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.equipment (id, name, category, total_qty, available_qty) VALUES
('sm58', 'Shure SM58', 'Microphone', 10, 8),
('sm57', 'Shure SM57', 'Microphone', 8, 6),
('focusrite', 'Scarlett 2i2', 'Interface', 15, 12),
('ts-cable', 'Instrument Cable (10ft)', 'Cable', 50, 40),
('strat', 'Fender Stratocaster', 'Instrument', 3, 2)
ON CONFLICT (id) DO NOTHING;
