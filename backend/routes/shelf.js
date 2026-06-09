import { Router } from 'express';
import { supabase } from '../lib/supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// GET /api/shelf/:username - Fetch profile and shelf_entries
router.get('/:username', async (req, res) => {
  try {
    const { username } = req.params;

    // Fetch profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, bio, avatar_url, created_at')
      .eq('username', username)
      .maybeSingle();

    if (profileError || !profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Fetch shelf entries for this profile
    const { data: entries, error: entriesError } = await supabase
      .from('shelf_entries')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });

    if (entriesError) {
      console.error('Error fetching shelf entries:', entriesError);
      return res.status(500).json({ error: 'Error fetching shelf entries' });
    }

    return res.json({ profile, entries });
  } catch (error) {
    console.error('GET /api/shelf/:username error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/shelf - Create a new shelf entry
router.post('/', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { rawg_game_id, game_title, game_cover_url, game_genres, status, rating, review } = req.body;

    if (!rawg_game_id || !game_title) {
      return res.status(422).json({ error: 'rawg_game_id and game_title are required' });
    }

    const { data, error } = await supabase
      .from('shelf_entries')
      .insert({
        user_id: userId,
        rawg_game_id,
        game_title,
        game_cover_url,
        game_genres,
        status: status || 'wishlist',
        rating,
        review
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating shelf entry:', error);
      return res.status(500).json({ error: 'Failed to create shelf entry' });
    }

    return res.status(201).json(data);
  } catch (error) {
    console.error('POST /api/shelf error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/shelf/:entryId - Update an entry
router.patch('/:entryId', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { entryId } = req.params;
    const { status, rating, review } = req.body;

    // Verify ownership
    const { data: entry, error: entryError } = await supabase
      .from('shelf_entries')
      .select('user_id')
      .eq('id', entryId)
      .maybeSingle();

    if (entryError || !entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    if (entry.user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized to update this entry' });
    }

    // Update
    const { data: updatedEntry, error: updateError } = await supabase
      .from('shelf_entries')
      .update({ status, rating, review })
      .eq('id', entryId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating shelf entry:', updateError);
      return res.status(500).json({ error: 'Failed to update shelf entry' });
    }

    return res.json(updatedEntry);
  } catch (error) {
    console.error('PATCH /api/shelf/:entryId error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/shelf/:entryId - Delete an entry
router.delete('/:entryId', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { entryId } = req.params;

    // Verify ownership
    const { data: entry, error: entryError } = await supabase
      .from('shelf_entries')
      .select('user_id')
      .eq('id', entryId)
      .maybeSingle();

    if (entryError || !entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    if (entry.user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized to delete this entry' });
    }

    // Delete
    const { error: deleteError } = await supabase
      .from('shelf_entries')
      .delete()
      .eq('id', entryId);

    if (deleteError) {
      console.error('Error deleting shelf entry:', deleteError);
      return res.status(500).json({ error: 'Failed to delete shelf entry' });
    }

    return res.json({ ok: true });
  } catch (error) {
    console.error('DELETE /api/shelf/:entryId error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
