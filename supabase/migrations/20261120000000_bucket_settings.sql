-- Buckets that already existed before the baseline keep their old settings
-- (the baseline only creates missing ones). Bring them in line.
update storage.buckets
set public = true, file_size_limit = 5242880, allowed_mime_types = array['image/jpeg', 'image/png', 'image/gif', 'image/webp']
where id = 'images';

update storage.buckets
set public = true, file_size_limit = 524288000, allowed_mime_types = null
where id = 'installers';
