-- Prints da folha de processo: 1 JPEG por kanban no Storage (não no Postgres).
-- Bucket público só para GET da URL; escrita autenticada e isolada por empresa_id no path.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'os-prints',
  'os-prints',
  true,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "os_prints_select_empresa" on storage.objects;
drop policy if exists "os_prints_insert_empresa" on storage.objects;
drop policy if exists "os_prints_update_empresa" on storage.objects;
drop policy if exists "os_prints_delete_empresa" on storage.objects;
drop policy if exists "os_prints_public_read" on storage.objects;

create policy "os_prints_public_read"
on storage.objects for select
to public
using (bucket_id = 'os-prints');

create policy "os_prints_insert_empresa"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'os-prints'
  and (storage.foldername(name))[1] = public.get_user_empresa_id()::text
);

create policy "os_prints_update_empresa"
on storage.objects for update
to authenticated
using (
  bucket_id = 'os-prints'
  and (storage.foldername(name))[1] = public.get_user_empresa_id()::text
)
with check (
  bucket_id = 'os-prints'
  and (storage.foldername(name))[1] = public.get_user_empresa_id()::text
);

create policy "os_prints_delete_empresa"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'os-prints'
  and (storage.foldername(name))[1] = public.get_user_empresa_id()::text
);
