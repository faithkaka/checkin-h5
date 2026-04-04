-- ============================================
-- 创建 Supabase Storage 配置
-- ============================================

-- 1. 创建 share-images bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('share-images', 'share-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. 授予公开读取权限
CREATE POLICY "Public Access" ON storage.objects FOR SELECT
USING (bucket_id = 'share-images');

CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'share-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated Update" ON storage.objects FOR UPDATE
USING (bucket_id = 'share-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated Delete" ON storage.objects FOR DELETE
USING (bucket_id = 'share-images' AND auth.role() = 'authenticated');

-- ============================================
-- 使用说明：
-- 1. 在 Supabase Dashboard → SQL Editor 执行上述 SQL
-- 2. 刷新 admin-share.html 页面
-- 3. 现在可以上传图片了
-- ============================================