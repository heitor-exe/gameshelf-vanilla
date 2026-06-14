<div align="center">

  # 🎮 GameShelf

  **Sua biblioteca pessoal e premium de jogos.**<br>
  Organize sua coleção, escreva análises detalhadas e acompanhe seus jogos favoritos.

  <p align="center">
    <img src="https://img.shields.io/badge/Vite-6495ED?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
    <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript" />
    <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
    <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
    <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
    <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  </p>

  <p align="center">
    <a href="#-sobre">Sobre</a> •
    <a href="#-funcionalidades">Funcionalidades</a> •
    <a href="#-tecnologias">Tecnologias</a> •
    <a href="#-como-executar">Como Executar</a> •
    <a href="#-design-system">Design</a> •
    <a href="#-licença">Licença</a>
  </p>
</div>

---

## 🌟 Sobre o Projeto

O **GameShelf** é uma aplicação web completa desenvolvida com foco absoluto em **alto desempenho e imersão visual**. Construído no formato de *monorepo*, o projeto utiliza **Vanilla JavaScript (ES Modules)** no frontend para garantir leveza máxima, dispensando frameworks pesados, e é suportado por um backend robusto em **Node.js** com banco de dados e autenticação providos pelo **Supabase**.

O objetivo principal do projeto é oferecer uma experiência de usuário (UX) premium para gamers que desejam um espaço pessoal, elegante e rápido para catalogar suas jornadas virtuais.

---

## ✨ Funcionalidades Principais

- 👤 **Área de Perfil**: Personalização completa de perfil, com biografia e avatares dinâmicos (integração com a API do Dicebear baseada no username do usuário).
- 📚 **Biblioteca Pessoal (Shelf)**: Gerencie seus jogos categorizando-os em status organizados: "Jogando", "Concluído", "Abandonado" ou "Lista de Desejos".
- ✍️ **Avaliações e Notas**: Atribua notas (1 a 5 estrelas) e escreva resenhas detalhadas documentando sua experiência e opinião sobre cada game.
- 📰 **Feed de Atividades**: Explore um feed dinâmico e global com as últimas resenhas e atualizações de estantes da comunidade.
- 🔍 **Busca de Jogos (Em breve)**: Estrutura base pronta para integração com a API do RAWG, visando busca rápida e preenchimento automático de dados dos jogos.
- 🔒 **Autenticação Segura**: Sistema robusto de Login e Registro protegido pelo Supabase Auth e gerenciamento de sessões criptografadas.

---

## 🛠️ Tecnologias Utilizadas

A stack foi escolhida para proporcionar o melhor balanço entre controle técnico absoluto e alta fidelidade visual.

### 🎨 Frontend
- **Vanilla JS (ES Modules)**: Controle nativo de rotas (SPA router em `main.js`) e reatividade via DOM manipulation direta.
- **Vite**: Build tool e servidor de desenvolvimento ultrarrápido, garantindo Hot Module Replacement instantâneo.
- **CSS3 Puro**: Arquitetura orientada a tokens (`tokens.css`), permitindo consistência sem dependência de bibliotecas CSS in JS ou Tailwind.

### ⚙️ Backend
- **Node.js & Express**: API RESTful bem estruturada para orquestrar todas as chamadas ao banco de dados e prover endpoints consumíveis.
- **Connect-PG-Simple**: Gerenciamento de sessões seguras persistidas no Postgres via cookies (`connect.sid`).

### 🗄️ Infraestrutura e Dados
- **Supabase**: Backend as a Service (BaaS) gerenciando autenticação e o banco de dados PostgreSQL.
- **Vercel**: Deploy simplificado do frontend com `vercel.json` já configurado para rotas SPA (Single Page Application rewrites).

---

## 🎨 Sistema de Design (Design System)

A interface do GameShelf foge do padrão utilitarista, adotando uma estética visual de primeira classe projetada para impressionar:

- 🌌 **Modo Escuro Imersivo**: Fundo profundo em tons escuros e elegantes (`#0e0e0e` a `#2c2c2c`), criando alto contraste com a cor primária vibrante **Lavender** (`#cf96ff`).
- 🪞 **Glassmorphism Avançado**: Uso extensivo de superfícies vítreas (`backdrop-filter: blur(20px)`) a 60% de opacidade em elementos flutuantes, modais e menus de navegação.
- 🖼️ **Ausência de Bordas Artificiais**: O projeto proíbe o uso de bordas sólidas de `1px`. Toda a sensação de profundidade e hierarquia é alcançada organicamente através de variações sutis no preenchimento de fundo e projeções de sombras calculadas.
- 🔤 **Tipografia Moderna**: Importação da família tipográfica **Inter** direto do Google Fonts, garantindo um visual contemporâneo e máxima legibilidade.

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- [Node.js](https://nodejs.org/en/) (v18+) instalado.
- Conta gratuita configurada no [Supabase](https://supabase.com/).

### 1. Clonando o Repositório

```bash
git clone https://github.com/heitor-exe/gameshelf-vanilla.git
cd gameshelf-vanilla
```

### 2. Configurando o Banco de Dados (Supabase)

Acesse o **SQL Editor** no painel de controle do seu projeto Supabase e execute as queries abaixo para criar a infraestrutura das tabelas e aplicar as Políticas de Segurança (Row Level Security):

<details>
<summary><b>🛠️ Mostrar Script SQL</b></summary>

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
</details>

### 3. Configurando as Variáveis de Ambiente (Backend)

Navegue até a pasta do backend, copie o arquivo de exemplo e configure suas credenciais:

```bash
cd backend
cp .env.example .env
```
Abra o arquivo `.env` gerado e preencha com suas credenciais do projeto Supabase. 
> ⚠️ **Atenção às Portas:** O frontend por padrão fará chamadas para a porta `3001` (vide `frontend/src/lib/api.js`). Certifique-se de configurar `PORT=3001` no backend e ajustar `FRONTEND_ORIGIN` apropriadamente se estiver rodando localmente.

### 4. Iniciando os Servidores de Desenvolvimento

O projeto requer que o **Backend** e o **Frontend** sejam rodados em terminais separados.

**Terminal 1 (Backend - API):**
```bash
cd backend
npm install
npm run dev
```

**Terminal 2 (Frontend - SPA):**
```bash
cd frontend
npm install
npm run dev
```

Abra o seu navegador no link disponibilizado pelo Vite no Terminal 2 (ex: `http://localhost:3000`) e divirta-se!

---

## 📁 Estrutura Detalhada do Monorepo

```text
gameshelf-vanilla/
├── frontend/             # 🎨 Interface de Usuário (Vite SPA)
│   ├── src/
│   │   ├── components/   # Modulares: navbar.js, gameCard.js, modal.js
│   │   ├── lib/          # Handlers: api.js, shelf-store.js, rawg.js (stub)
│   │   ├── pages/        # Telas: home.js, search.js, profile.js, auth...
│   │   ├── styles/       # Design System: tokens.css, global.css + pages css
│   │   └── main.js       # Entrypoint JavaScript e Roteador Frontend
│   ├── index.html        # Entrypoint HTML da aplicação
│   └── vercel.json       # Configurações de Deploy (SPA rewrites)
│
└── backend/              # ⚙️ Servidor Lógico (Node.js/Express)
    ├── lib/              # Configuração Supabase (supabase.js)
    ├── middleware/       # Guards: auth.js (Proteção de rotas)
    ├── routes/           # Módulos: auth.js, shelf.js, profile.js, feed.js
    └── server.js         # Setup do Express, Sessions e CORS
```

---

## 🤝 Como Contribuir

Sinta-se livre para contribuir relatando *Bugs*, sugerindo melhorias ou enviando novos recursos através de *Pull Requests*.

1. Faça o **Fork** do projeto.
2. Crie uma **Branch** para a sua funcionalidade (`git checkout -b feature/SuaFuncionalidade`).
3. Adicione suas alterações ao **Stage** (`git add .`).
4. Realize o **Commit** das suas mudanças (`git commit -m 'feat: adicionado tal recurso'`).
5. Dê um **Push** para a branch no repositório remoto (`git push origin feature/SuaFuncionalidade`).
6. Abra um **Pull Request**.

---

## 📄 Licença

Este projeto é de código aberto e distribuído sob a licença **MIT**. Sinta-se à vontade para usá-lo e modificá-lo livremente.

---

<div align="center">
  <p>Desenvolvido com dedicação por <b><a href="https://github.com/heitor-exe">Heitor</a></b>.</p>
</div>
