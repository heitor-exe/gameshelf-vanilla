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

router.get('/trending', async (req, res) => {
  try {
    // Mudamos do Polygon para o RSS do GameSpot porque o Polygon não
    // fornece mais um sub-feed dedicado apenas a notícias de jogos.
    const rssUrl = encodeURIComponent('https://www.gamespot.com/feeds/game-news/');
    const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${rssUrl}`);
    
    if (!response.ok) {
      throw new Error(`News API error: ${response.status}`);
    }
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching trending news:', error);
    res.status(500).json({ error: 'Failed to fetch trending news' });
  }
});

export default router;
