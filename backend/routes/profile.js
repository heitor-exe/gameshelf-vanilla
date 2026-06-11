import { Router } from 'express';
import { supabase } from '../lib/supabase.js';

const router = Router();

router.get('/:username', async (req, res) => {
  try {
    const { username } = req.params;

    // 1. Fetch profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .maybeSingle();

    if (profileError || !profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // 2. Fetch all shelf entries to calculate stats
    const { data: allEntries, error: entriesError } = await supabase
      .from('shelf_entries')
      .select('status, game_genres')
      .eq('user_id', profile.id);

    if (entriesError) {
      return res.status(500).json({ error: 'Failed to fetch shelf stats' });
    }

    const totalEntries = allEntries.length;
    const countPerStatus = {
      playing: 0,
      completed: 0,
      dropped: 0,
      wishlist: 0,
    };
    const genreCounts = {};

    allEntries.forEach(entry => {
      if (entry.status) {
        countPerStatus[entry.status] = (countPerStatus[entry.status] || 0) + 1;
      }
      if (entry.game_genres && Array.isArray(entry.game_genres)) {
        entry.game_genres.forEach(g => {
          genreCounts[g] = (genreCounts[g] || 0) + 1;
        });
      }
    });

    let mostFrequentGenre = null;
    let maxCount = 0;
    for (const [genre, count] of Object.entries(genreCounts)) {
      if (count > maxCount) {
        mostFrequentGenre = genre;
        maxCount = count;
      }
    }

    const stats = {
      totalEntries,
      countPerStatus,
      mostFrequentGenre
    };

    // 3. Fetch 4 most recent "playing"
    const { data: recentPlaying, error: playingError } = await supabase
      .from('shelf_entries')
      .select('*')
      .eq('user_id', profile.id)
      .eq('status', 'playing')
      .order('created_at', { ascending: false })
      .limit(4);

    // 4. Fetch 3 most recent with review text
    const { data: recentReviews, error: reviewsError } = await supabase
      .from('shelf_entries')
      .select('*')
      .eq('user_id', profile.id)
      .neq('review', '')
      .not('review', 'is', null)
      .order('created_at', { ascending: false })
      .limit(3);

    res.json({
      profile,
      stats,
      recentPlaying: recentPlaying || [],
      recentReviews: recentReviews || []
    });

  } catch (err) {
    console.error('Profile route error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
