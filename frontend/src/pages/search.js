/**
 * search.js — Página de Busca do GameShelf
 *
 * Responsabilidades:
 *  - Renderizar o campo de busca com filtro por gênero
 *  - Exibir os jogos em grade, filtrando em tempo real conforme o usuário digita
 *  - Abrir o modal "Add to Shelf" ao clicar em um jogo
 *  - Ler o parâmetro ?q= da URL para suportar buscas iniciadas pela navbar
 *
 * Futuramente: MOCK_GAMES será substituído por chamadas à RAWG API via src/lib/rawg.js
 */

import { createNavbar } from "../components/navbar.js";
import { openModal } from "../components/modal.js";

// ---------------------------------------------------------------------------
// Dados mock — serão substituídos pela RAWG API quando a integração estiver pronta.
// Cada objeto simula a estrutura que a API retornará:
//   id, title, cover_url, year, genres[], rating
// ---------------------------------------------------------------------------
const MOCK_GAMES = [
  {
    id: 1,
    title: "Cyberpunk: Neon Nights",
    cover_url: "https://picsum.photos/seed/game1/300/400",
    year: 2026,
    genres: ["RPG", "Action"],
    rating: 4.5,
  },
  {
    id: 2,
    title: "Velocity Overdrive 4",
    cover_url: "https://picsum.photos/seed/game2/300/400",
    year: 2025,
    genres: ["Racing", "Action"],
    rating: 4.8,
  },
  {
    id: 3,
    title: "Pixel Woods",
    cover_url: "https://picsum.photos/seed/game3/300/400",
    year: 2024,
    genres: ["Platformer", "Indie"],
    rating: 4.2,
  },
  {
    id: 4,
    title: "Elden Magic",
    cover_url: "/assets/elden_magic.png",
    year: 2026,
    genres: ["RPG", "Fantasy"],
    rating: 4.9,
  },
  {
    id: 5,
    title: "Galactic Empire Builder",
    cover_url: "https://picsum.photos/seed/game5/300/400",
    year: 2023,
    genres: ["Strategy", "Simulation"],
    rating: 4.0,
  },
  {
    id: 6,
    title: "Shadow Ninja",
    cover_url: "https://picsum.photos/seed/game6/300/400",
    year: 2025,
    genres: ["Action", "Stealth"],
    rating: 4.6,
  },
  {
    id: 7,
    title: "Stardew Valley 2",
    cover_url: "https://picsum.photos/seed/game7/300/400",
    year: 2027,
    genres: ["RPG", "Indie"],
    rating: 4.9,
  },
  {
    id: 8,
    title: "Mech Commander",
    cover_url: "https://picsum.photos/seed/game8/300/400",
    year: 2024,
    genres: ["Strategy", "Action"],
    rating: 4.1,
  },
  {
    id: 9,
    title: "Crimson Dragon",
    cover_url: "https://picsum.photos/seed/game9/300/400",
    year: 2026,
    genres: ["RPG", "Action"],
    rating: 4.4,
  },
  {
    id: 10,
    title: "Infinite Puzzle",
    cover_url: "https://picsum.photos/seed/game10/300/400",
    year: 2022,
    genres: ["Puzzle", "Indie"],
    rating: 4.7,
  },
];

// ---------------------------------------------------------------------------
// Gêneros disponíveis como filtro rápido.
// "ALL GAMES" é o estado padrão — sem filtro de gênero ativo.
// ---------------------------------------------------------------------------
const FILTER_GENRES = ["ALL GAMES", "RPG", "ACTION", "INDIE", "STRATEGY"];

/**
 * renderSearch — ponto de entrada da página.
 *
 * Recebe o elemento #app como `container` e constrói toda a UI via DOM imperativo
 * (sem framework). O padrão adotado no projeto é: cada página limpa o container,
 * reconstrói do zero e anexa seus elementos.
 *
 * @param {HTMLElement} container - O elemento raiz #app onde a página será montada.
 */
export function renderSearch(container) {
  // Limpa o conteúdo anterior (outra página que estava montada no #app)
  container.innerHTML = "";

  // Navbar
  // createNavbar() lê window.location.pathname para marcar o link ativo.
  const navbar = createNavbar();
  container.appendChild(navbar);

  // Wrapper principal da página
  const pageContainer = document.createElement("div");
  pageContainer.className = "page-container search-container";

  // Cabeçalho: input + filtros
  const searchHeader = document.createElement("div");
  searchHeader.className = "search-header";

  // Wrapper do input existe para posicionar o hint "PRESS / TO FOCUS"
  // com position: absolute sem afetar o layout do input em si.
  const searchWrapper = document.createElement("div");
  searchWrapper.className = "search-input-wrapper";

  // Pré-preenchimento via URL
  // A navbar pode navegar para /search?q=termo quando o usuário digita nela.
  // Aqui lemos esse parâmetro para pré-preencher o campo e já disparar a busca.
  const urlParams = new URLSearchParams(window.location.search);
  const initialQuery = urlParams.get("q") || "";

  const input = document.createElement("input");
  input.type = "text";
  input.className = "search-hero-input";
  input.placeholder = "Search your digital library...";
  input.value = initialQuery;

  // Dica visual do atalho de teclado "/". O CSS oculta automaticamente
  // via :focus-within quando o input está focado.
  const hint = document.createElement("span");
  hint.className = "shortcut-hint";
  hint.textContent = "PRESS / TO FOCUS";

  searchWrapper.appendChild(input);
  searchWrapper.appendChild(hint);

  // Pills de filtro por gênero
  const filtersContainer = document.createElement("div");
  filtersContainer.className = "filter-pills";

  // Estado do filtro ativo. Vive fora de renderGrid() para persistir
  // entre as re-renderizações do grid causadas pela digitação no input.
  let activeFilter = "ALL GAMES";

  FILTER_GENRES.forEach((genre) => {
    const pill = document.createElement("button");
    pill.className = `filter-pill ${genre === activeFilter ? "active" : ""}`;
    pill.textContent = genre;

    pill.addEventListener("click", () => {
      // Atualiza o estado e a aparência de todos os pills antes de re-renderizar
      activeFilter = genre;
      Array.from(filtersContainer.children).forEach((p) =>
        p.classList.remove("active"),
      );
      pill.classList.add("active");
      renderGrid();
    });

    filtersContainer.appendChild(pill);
  });

  searchHeader.appendChild(searchWrapper);
  searchHeader.appendChild(filtersContainer);
  pageContainer.appendChild(searchHeader);

  // Grade de jogos
  // O container da grade é criado aqui e preenchido por renderGrid().
  // Separar criação de preenchimento permite re-renderizar só o interior
  // sem recriar o container (evita flicker de layout).
  const gridContainer = document.createElement("div");
  gridContainer.className = "games-grid";

  pageContainer.appendChild(gridContainer);
  container.appendChild(pageContainer);

  // renderGrid - função interna
  /**
   * Limpa e repopula a grade de jogos com base no texto digitado e no filtro
   * de gênero ativo. É chamada a cada keystroke e a cada troca de filtro.
   *
   * Por ser uma função interna (closure), ela acessa diretamente `input`,
   * `activeFilter` e `gridContainer` sem precisar de parâmetros.
   */
  const renderGrid = () => {
    gridContainer.innerHTML = "";

    const term = input.value.toLowerCase().trim();

    // Duplo filtro: título contém o termo digitado E gênero bate com o pill ativo.
    // game.genres é um array — normalizamos tudo para maiúsculas na comparação
    // porque o pill armazena o gênero em caixa alta (ex: "RPG") e o dado usa
    // capitalização mista (ex: "Rpg" ou "RPG" dependendo da fonte).
    const filtered = MOCK_GAMES.filter((game) => {
      const matchTitle = game.title.toLowerCase().includes(term);
      const matchGenre =
        activeFilter === "ALL GAMES" ||
        game.genres.map((g) => g.toUpperCase()).includes(activeFilter);
      return matchTitle && matchGenre;
    });

    // Estado vazio: mensagem centralizada no grid via grid-column: 1 / -1
    if (filtered.length === 0) {
      gridContainer.innerHTML = `
        <p style="color: var(--color-on-surface-variant); text-align: center; grid-column: 1 / -1;">
          No games found matching your search.
        </p>`;
      return;
    }

    filtered.forEach((game) => {
      const card = document.createElement("article");
      card.className = "game-card";

      // A imagem de capa é edge-to-edge dentro do wrapper (sem padding),
      // seguindo a regra do design system definida em global.css.
      card.innerHTML = `
        <div class="cover-art-wrapper">
          <img src="${game.cover_url}" alt="${game.title}" class="cover-art">
        </div>
        <div class="game-info">
          <span class="game-info-title">${game.title}</span>
          <span class="game-info-meta">${game.year} • ${game.genres.join(", ")}</span>
        </div>
      `;

      // Ao clicar no card, abre o modal "Add to Shelf" passando o jogo
      // e o callback global window.onSave, que é registrado em main.js e
      // persiste o jogo no shelf-store (localStorage).
      card.addEventListener("click", () => {
        openModal(game, window.onSave);
      });

      gridContainer.appendChild(card);
    });
  };

  // Eventos

  // Re-renderiza a grade a cada caractere digitado (busca instantânea).
  // Para dados mock isso é seguro. Se for integrar com a RAWG API no futuro,
  // adicionar debounce aqui para não disparar uma requisição por keystroke.
  input.addEventListener("input", () => {
    renderGrid();
  });

  // Atalho de teclado: "/" foca o campo de busca
  //
  // O listener precisa ir em `document` porque o usuário pode estar com o
  // foco em qualquer outro lugar da página ao pressionar "/".
  //
  // PROBLEMA: este listener sobrevive à navegação entre páginas.
  // O router em main.js destrói a página com container.innerHTML = "", mas
  // o evento continua registrado no `document`. Se o usuário voltar para
  // /search sem recarregar, um novo listener seria criado e acumulariam.
  //
  // SOLUÇÃO (self-cleaning): a cada disparo, verificamos se o `input`
  // ainda pertence ao documento. Se não pertencer mais (porque a página
  // foi destruída), removemos o listener e encerramos. Não dependemos de
  // eventos de remoção de DOM (como o obsoleto DOMNodeRemovedFromDocument).
  const handleKeydown = (e) => {
    if (!document.body.contains(input)) {
      // A página de busca foi destruída — remove este listener e para.
      document.removeEventListener("keydown", handleKeydown);
      return;
    }

    // Só ativa se "/" for pressionado fora de qualquer campo de texto
    if (
      e.key === "/" &&
      document.activeElement !== input &&
      document.activeElement.tagName !== "INPUT" &&
      document.activeElement.tagName !== "TEXTAREA"
    ) {
      e.preventDefault(); // Impede que "/" seja digitado no campo ao focar
      input.focus();
    }
  };

  document.addEventListener("keydown", handleKeydown);

  // Renderização inicial — síncrona para evitar flash de grid vazio.
  // renderGrid() pode rodar imediatamente porque gridContainer já está no DOM
  // (foi appendado algumas linhas acima).
  renderGrid();

  // focus() e setSelectionRange() precisam ser adiados com setTimeout(fn, 0):
  // alguns browsers ignoram .focus() se chamado durante o mesmo tick em que o
  // elemento foi inserido no documento. O adiamento garante que o browser já
  // finalizou o layout antes de tentarmos mover o foco.
  setTimeout(() => {
    if (window.location.pathname === "/search") {
      input.focus();

      // Se havia um query inicial vindo da URL, posiciona o cursor no final
      // do texto pré-preenchido em vez de selecionar tudo (comportamento padrão).
      if (initialQuery) {
        input.setSelectionRange(initialQuery.length, initialQuery.length);
      }
    }
  }, 0);
}
