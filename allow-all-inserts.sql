ALTER TABLE pet_reports ENABLE ROW LEVEL SECURITY; CREATE POLICY "Allow insert for all" ON pet_reports FOR INSERT USING (true);
