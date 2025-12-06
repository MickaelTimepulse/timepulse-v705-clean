-- Test si is_supabase_admin() fonctionne
SELECT is_supabase_admin();

-- Voir les policies sur organizers
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename = 'organizers' 
AND policyname LIKE '%admin%'
ORDER BY policyname;
