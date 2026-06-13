import { Router } from 'express';
import { supabase } from '../lib/supabase.js';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 1. Validação de dados básicos
    if (!username || !email || !password) {
      return res.status(422).json({ error: 'Username, email, e password são obrigatórios.' });
    }

    if (username.trim().length < 3) {
      return res.status(422).json({ error: 'O username deve ter pelo menos 3 caracteres.' });
    }

    if (password.length < 6) {
      return res.status(422).json({ error: 'A senha deve ter pelo menos 6 caracteres.' });
    }

    // 2. Verifica se o username já está em uso na tabela profiles
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username)
      .maybeSingle();

    if (profileCheckError) {
      console.error('Erro ao verificar o perfil:', profileCheckError);
      return res.status(500).json({ error: 'Erro interno do servidor.' });
    }

    if (existingProfile) {
      return res.status(400).json({ error: 'Username já está em uso.' });
    }

    // 3. Cadastra o usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      return res.status(422).json({ error: authError.message });
    }

    const user = authData.user;
    if (!user) {
      return res.status(422).json({ error: 'Falha ao criar o usuário de autenticação.' });
    }

    // 4. Insere o registro na tabela profiles
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({ id: user.id, username });

    if (insertError) {
      console.error('Erro ao inserir o perfil no banco:', insertError);
      return res.status(422).json({ error: insertError.message });
    }

    // 5. Retorna sucesso com status 201
    return res.status(201).json({
      user: {
        id: user.id,
        username,
      },
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(422).json({ error: 'Email e senha são obrigatórios.' });
    }

    // 1. Faz login usando a autenticação do Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    const user = authData.user;
    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas.' });
    }

    // 2. Busca o username e avatar_url na tabela profiles
    // Solicitamos também o avatar_url para atualizar a UI do usuário no frontend imediatamente após o login.
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Erro ao buscar perfil do usuário:', profileError);
      return res.status(404).json({ error: 'Perfil de usuário não encontrado.' });
    }

    // 3. Salva o ID do usuário na sessão
    req.session.userId = user.id;

    // 4. Retorna sucesso com status 200
    return res.status(200).json({
      user: {
        id: user.id,
        username: profile.username,
        avatar_url: profile.avatar_url,
      },
    });
  } catch (error) {
    console.error('Erro no login:', error);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Erro ao destruir sessão de logout:', err);
      return res.status(500).json({ error: 'Erro ao deslogar.' });
    }
    res.clearCookie('connect.sid');
    return res.status(200).json({ ok: true });
  });
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Não autorizado.' });
    }

    // Busca o perfil do usuário no Supabase
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      return res.status(401).json({ error: 'Perfil não encontrado para a sessão atual.' });
    }

    return res.status(200).json(profile);
  } catch (error) {
    console.error('Erro ao buscar informações da sessão (/me):', error);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

export default router;
