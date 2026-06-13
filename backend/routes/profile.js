import { Router } from 'express';
import { supabase } from '../lib/supabase.js';
import { requireAuth } from '../middleware/auth.js';

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

// Rota PUT para atualizar o perfil do usuário logado (bio, username e avatar)
router.put('/', requireAuth, async (req, res) => {
  try {
    const { bio, username, avatar_url, avatar_base64 } = req.body;
    const userId = req.session.userId;

    const updates = {};
    if (bio !== undefined) updates.bio = bio;
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;

    // Se o usuário enviou uma nova imagem (em formato base64)
    if (avatar_base64) {
      // Extrai o tipo da imagem e os dados reais usando Expressão Regular
      const matches = avatar_base64.match(/^data:(image\/\w+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const contentType = matches[1]; // ex: image/png
        const base64Data = matches[2]; // ex: iVBORw0K...
        
        // Converte a string base64 de volta para um arquivo binário (Buffer)
        const buffer = Buffer.from(base64Data, 'base64');
        const ext = contentType.split('/')[1];
        
        // Cria um nome de arquivo único para não sobrescrever acidentalmente outros avatares
        const filename = `${userId}/avatar-${Date.now()}.${ext}`;

        // Faz o upload do arquivo para o bucket 'avatars' no Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filename, buffer, {
            contentType,
            upsert: true
          });

        if (uploadError) {
          console.error('Avatar upload error:', uploadError);
          return res.status(500).json({ error: 'Failed to upload avatar image.' });
        }

        // Recupera o link público para a imagem recém adicionada
        const { data: publicUrlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(filename);
        
        // Atualiza a URL do avatar no banco de dados com este novo link
        if (publicUrlData && publicUrlData.publicUrl) {
          updates.avatar_url = publicUrlData.publicUrl;
        }
      } else {
        return res.status(422).json({ error: 'Invalid image format. Must be base64.' });
      }
    }

    // Valida e atualiza o nome de usuário, caso tenha sido modificado
    if (username !== undefined && username.trim().length > 0) {
      const newUsername = username.trim();
      
      // O nome deve ter pelo menos 3 letras
      if (newUsername.length < 3) {
        return res.status(422).json({ error: 'Username must be at least 3 characters.' });
      }
      // Verifica se o novo username já está em uso por outro usuário
      const { data: existing, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', newUsername)
        .neq('id', userId) // ignorar o próprio usuário na busca
        .maybeSingle();

      if (checkError) {
        return res.status(500).json({ error: 'Error validating username.' });
      }
      if (existing) {
        return res.status(400).json({ error: 'Username already in use.' });
      }
      updates.username = newUsername;
    }

    // Salva todas as modificações consolidadas na tabela profiles
    const { data: profile, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Update profile error:', error);
      return res.status(500).json({ error: 'Failed to update profile' });
    }

    res.json(profile);
  } catch (err) {
    console.error('Profile route error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
