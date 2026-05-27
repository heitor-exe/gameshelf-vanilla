# 🎮 GameShelf

<p align="center">
  <img src="https://img.shields.io/badge/Vite-6495ED?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript" />
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
</p>

---

## 🌟 Sobre o Projeto

O **GameShelf** é uma biblioteca de jogos pessoal e premium, projetada para permitir que você organize sua coleção de games, escreva análises detalhadas e acompanhe a atividade de jogos dos seus amigos.

Este projeto foi construído no formato de **monorepo** com foco absoluto em **alto desempenho**, utilizando **Vanilla JavaScript (ES Modules)** no frontend e um sistema de design customizado moderno e imersivo (Glassmorphism e Dark Mode).

---

## ✨ Funcionalidades Principais

- 👤 **Área de Perfil**: Personalização de perfil de usuário com avatar e biografia.
- 📚 **Biblioteca Pessoal**: Gerencie seus jogos categorizados por status ("Jogando", "Concluído", "Abandonado", "Lista de Desejos").
- ✍️ **Avaliações de Jogos**: Dê notas de 1 a 5 estrelas e escreva resenhas detalhadas de cada game.
- 📰 **Feed de Atividades**: Acompanhe o fluxo dinâmico de resenhas e atualizações de estantes.
- 🎨 **Design System Premium**: Interface escura elegante baseada em Glassmorphism (`backdrop-filter: blur(20px)`), sombras profundas e transições suaves sem bordas de 1px artificiais.

---

## 🛠️ Tecnologias Utilizadas

| Componente | Tecnologia | Descrição |
| :--- | :--- | :--- |
| **Frontend** | **Vanilla JS (ES6+)** | Lógica de rotas e componentes reativos sem frameworks pesados |
| **Build Tool** | **Vite** | Empacotador extremamente rápido para desenvolvimento moderno |
| **Estilização** | **CSS3 Puro** | Sistema de tokens centralizado e flexível em `tokens.css` |
| **Backend** | **Node.js + Express** | API REST estruturada para gerenciar autenticação, feed e estantes |
| **Banco de Dados**| **Supabase (PostgreSQL)** | Banco de dados relacional na nuvem com autenticação segura integrada |

---

## 📁 Estrutura de Diretórios

```text
gameshelf-vanilla/
├── frontend/             # Aplicação SPA (Vite)
│   ├── src/
│   │   ├── components/   # Componentes visuais (Navbar, GameCard, Modais)
│   │   ├── pages/        # Telas da aplicação (Home, Search, Shelf, Profile)
│   │   ├── styles/       # Tokens de Design e estilos globais
│   │   └── lib/          # Clientes de API e gerenciador de estado local
│   └── index.html
├── backend/              # Servidor API (Express)
│   ├── routes/           # Endpoints da API (Auth, Feed, Profile, Shelf)
│   ├── middleware/       # Middlewares de segurança e validação
│   └── server.js         # Ponto de entrada da API
└── README.md             # Documentação do projeto
```

---

## 🎨 Sistema de Design (Design System)

A estética visual do GameShelf foi construída para parecer um produto state-of-the-art:
* **Paleta de Cores**: Fundo ultra-escuro elegante (`#0e0e0e` a `#2c2c2c`) com detalhes vibrantes em **Lavender** (`#cf96ff`).
* **Estratégia de Superfície**: Zero uso de bordas de 1px. A profundidade dos cards e modais é criada puramente por variações harmoniosas de tom de fundo e sombras.
* **Glassmorphic Glow**: Uso de desfoque de fundo avançado (`backdrop-filter: blur(20px)`) em modais e menus flutuantes.
* **Tipografia**: Família de fontes **Inter** (pesos 400, 500, 700 e 800) importada diretamente do Google Fonts.

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
* Node.js (v18 ou superior)
* Conta no [Supabase](https://supabase.com/)

---

### Passo 1: Configuração do Banco de Dados (Supabase)

No editor SQL do seu projeto no Supabase, execute o script abaixo para criar as tabelas necessárias:

```sql
-- Criar tabela de perfis de usuário
create table profiles (
  id uuid references auth.users primary key,
  username text unique not null,
  bio text,
  avatar_url text,
  created_at timestamptz default now()
);

-- Criar tabela de estante de jogos
create table shelf_entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  rawg_game_id integer not null,
  game_title text not null,
  game_cover_url text,
  game_genres text[],
  status text check (status in ('playing','completed','dropped','wishlist')),
  rating integer check (rating between 1 and 5),
  review text,
  created_at timestamptz default now()
);

-- Habilitar Row Level Security (RLS)
alter table shelf_entries enable row level security;

-- Criar políticas de segurança (Policies)
create policy "Users can manage own entries"
  on shelf_entries for all
  using (user_id = auth.uid());

create policy "Entries are publicly readable"
  on shelf_entries for select
  using (true);
```

---

### Passo 2: Configuração das Variáveis de Ambiente

1. Vá para a pasta `backend/`.
2. Duplique o arquivo `.env.example` e renomeie-o para `.env`.
3. Preencha os campos com as credenciais do seu projeto Supabase:
   ```env
   PORT=3000
   SUPABASE_URL=https://seu-projeto.supabase.co
   SUPABASE_SERVICE_KEY=sua_chave_secreta_service_role
   DATABASE_URL=postgresql://postgres.seu-projeto:[senha]@aws-0.pooler.supabase.com:6543/postgres
   SESSION_SECRET=uma_chave_aleatoria_para_seguranca
   FRONTEND_ORIGIN=http://localhost:5173
   ```

---

### Passo 3: Executando o Servidor API (Backend)

No seu terminal, vá para a pasta `backend` e execute:

```bash
cd backend
npm install
npm run dev
```
O servidor backend iniciará usando `nodemon` na porta configurada (geralmente `http://localhost:3000` ou `http://localhost:3001`).

---

### Passo 4: Executando a Aplicação Web (Frontend)

Abra outro terminal, vá para a pasta `frontend` e execute:

```bash
cd frontend
npm install
npm run dev
```
O servidor de desenvolvimento do Vite iniciará. Abra no seu navegador o endereço fornecido no terminal (geralmente `http://localhost:5173` ou `http://localhost:3000`).

---

## 📄 Licença

Este projeto é de código aberto e está licenciado sob a [MIT License](LICENSE).
