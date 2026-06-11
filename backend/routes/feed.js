import { Router } from 'express';
import { supabase } from '../lib/supabase.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('shelf_entries')
      .select(`
        *,
        profiles!inner(username, avatar_url)
      `)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching feed:', error);
      return res.status(500).json({ error: 'Failed to fetch feed' });
    }

    res.json(data);
  } catch (err) {
    console.error('Feed route error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
