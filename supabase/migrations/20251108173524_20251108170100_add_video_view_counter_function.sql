/*
  # Add video view counter function

  1. Functions
    - `increment_video_views` - Safely increment view count for a video

  2. Security
    - Function is accessible to all users (public)
    - Uses SECURITY DEFINER to bypass RLS for increment operation
*/

CREATE OR REPLACE FUNCTION increment_video_views(video_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE videos
  SET view_count = view_count + 1
  WHERE id = video_id;
END;
$$;
