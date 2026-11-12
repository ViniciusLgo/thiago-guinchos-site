# Site da Thiago Guinchos

Site estático de uma página (HTML, CSS e JS puros mais Three.js 0.160.0 via CDN). O sistema da empresa fica em outro repositório: projetoGuincho.

## Comece por aqui

- [README.md](README.md): estrutura, como editar e montar.
- [docs/spec.md](docs/spec.md): seções, roteiro do KM 02, tokens visuais e conteúdo provisório.

## Regras

- **Nunca edite `index.html` à mão.** Edite `src/` e rode `npm run montar`. O CI (`npm run verificar`) falha se o `index.html` estiver desatualizado.
- Textos em português do Brasil, com acentos. Pouco texto: a página deve continuar curta (cerca de 6 telas no PC).
- Mantenha os fallbacks: `prefers-reduced-motion` (quadro fixo) e sem WebGL (ilustração SVG).
- Depoimentos de exemplo levam `data-exemplo="true"`. Toda foto ou avatar novo entra em `docs/creditos.md`.
- Commits no padrão Conventional Commits, em português (`feat:`, `fix:`, `docs:`, `chore:`, `ci:`).
- Não faça push nem merge sem o usuário pedir.
