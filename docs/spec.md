# Spec: site institucional da Thiago Guinchos

| | |
|---|---|
| Situação | Protótipo aprovado pelo dono do projeto em 2026-11-12 |
| Público | Motorista com o carro parado, quase sempre no celular, querendo resolver rápido. Em segundo lugar, seguradoras e associações que contratam o serviço |
| Objetivo | Levar a pessoa ao WhatsApp ou à ligação em poucos segundos e passar confiança de empresa organizada |
| Sistema relacionado | [projetoGuincho](https://github.com/ViniciusLgo/projetoGuincho), o painel do gerente e o app do motorista. O sistema tem um link "Site da empresa" que aponta para este site |

## 1. Princípios

1. **Pouco texto.** O site anterior tinha 13 telas de rolagem no PC. Este fica em cerca de 6 telas no PC (5.296 px em 1440×900). A seção "Como funciona" sozinha ocupa 2,5 telas porque fica parada enquanto a animação roda.
2. **O botão de chamar está sempre à mão.** O WhatsApp aparece no cabeçalho, no topo, no contato, no rodapé e na barra fixa do celular.
3. **A animação mostra, não enfeita.** As cenas 3D contam o serviço de verdade: o guincho sai do pátio, vai até o carro parado e leva até a oficina.
4. **Funciona sem nada especial.** Sem WebGL aparece uma ilustração em SVG. Com "reduzir movimento" ligado no aparelho aparece um quadro fixo. A página abre com duplo clique, sem servidor.

## 2. Estrutura da página

Cada seção leva um marco de rodovia ("KM 01", "KM 02"...), a identidade visual de estrada que o sistema também usa.

| Ordem | Seção | Conteúdo |
|---|---|---|
| Topo | Cabeçalho fixo | Logo, menu e botão WhatsApp. No celular o menu abre um painel |
| — | Abertura (`#inicio`) | Cena 3D do guincho na rodovia à noite, título "Guincho 24 horas", botões WhatsApp e Ligar, linha "2020 · 10 caminhões · 24h" |
| KM 01 | Serviços (`#servicos`) | 6 blocos: ícone mais 2 a 4 palavras cada |
| — | Seguradoras parceiras | Faixa que rola sozinha: Porto Seguro, Tato Assist, APVS Brasil, Foco Proteção Veicular, Gol Plus, Localiza, S Group |
| KM 02 | Do chamado à entrega (`#como-funciona`) | Cena 3D presa na tela; a rolagem avança 4 etapas (ver seção 3) |
| KM 03 | Depoimentos (`#depoimentos`) | Carrossel com 10 depoimentos e 3 fotos de guincho no meio |
| KM 04 | Contato (`#contato`) | Telefone em formato de placa Mercosul, WhatsApp, Ligar, endereço com "Ver no mapa" e Instagram |
| — | Rodapé | Uma linha: direitos, WhatsApp e Instagram |

Saíram de propósito, para encurtar: Frota, Sobre, o bloco que falava do sistema e o mapa embutido.

## 3. KM 02: o roteiro do resgate

A rolagem controla a animação. As 4 etapas aparecem ao lado da cena; a etapa ativa ganha destaque e as anteriores recebem um check.

| Etapa | O que a cena mostra |
|---|---|
| 1. Pedido no WhatsApp | Pátio da Thiago Guinchos à noite: portão com logo, galpão, mais 2 caminhões parados, luz do pátio. Chega a mensagem |
| 2. Guincho a caminho | O giroflex acende e o guincho sai pela estrada com curva, postes, placas de km, árvores e coqueiros. O alfinete de GPS e o trajeto pontilhado acompanham |
| 3. Chegada no local | No acostamento: carro com pisca-alerta, triângulo, capô aberto e fumaça, motorista ao celular |
| 4. Entrega segura | A plataforma inclina, o carro sobe, o motorista entra na cabine e o guincho leva até a oficina, onde aparece o check |

A câmera acompanha o caminhão de forma suave. No celular a cena tem menos árvores e postes, um só caminhão no pátio e mostra apenas a etapa ativa.

## 4. Identidade visual

Segue a direção "Sinal de Rodovia" do sistema (spec de rebranding no repositório do sistema).

| Token | Valor | Uso |
|---|---|---|
| `--sinal` | `#F5B800` | Amarelo da marca: botões principais, marcos de km, destaques |
| `--asfalto` | `#16181B` | Fundo principal (escuro) |
| `--asfalto-2` | `#0E1013` | Fundo mais profundo, `theme-color` |
| `--papel` | `#F2F2EE` | Seção clara (depoimentos) |

Fontes: **Barlow Condensed** (títulos, marcos, placa) e **Barlow** (texto), do Google Fonts. Ícones SVG próprios em `src/simbolos.html`, no traço do Lucide.

## 5. Acessibilidade e desempenho

- Contraste AA em todo texto; botões com área mínima de 44 px.
- Cenas 3D são decorativas (`aria-hidden`); as etapas e textos estão em HTML e são lidos por leitor de tela.
- `prefers-reduced-motion`: sem animação, quadro fixo com as 4 etapas legíveis.
- Sem WebGL: ilustração SVG no lugar das cenas.
- A animação só roda com a seção visível na tela (IntersectionObserver) e pausa com a aba escondida.
- Sem rolagem horizontal em 390 px nem em 1440 px; sem erros no console (conferido com Playwright).
- SEO: `title` e `description` locais ("Guincho 24 horas em Camaçari"), Open Graph e dados estruturados `AutomotiveBusiness`/`LocalBusiness` (JSON-LD) com serviços, telefone e endereço.

## 6. Tecnologia

- HTML, CSS e JavaScript puros, sem framework.
- [Three.js 0.160.0](https://threejs.org/) via jsDelivr (import map). Caminhão, carro e cenário são modelados no código (low-poly), sem arquivos 3D.
- `scripts/montar.mjs` junta `src/` num único `index.html`, com o script da cena embutido, para abrir sem servidor.

## 7. Conteúdo provisório (trocar antes de publicar)

| Item | Situação |
|---|---|
| 7 depoimentos | De exemplo, marcados com `data-exemplo="true"`. Trocar pelos reais (os 3 primeiros já são do site atual) |
| Fotos | Ilustrativas do Unsplash, não são da frota. Trocar por fotos dos caminhões do Thiago |
| "desde 2020" | O MEI é de 20/09/2022. Confirmar com o Thiago |
| CNPJ | O site antigo mostra 33.949.886/0001-73; na Receita, a empresa é 48.016.487/0001-27. Confirmar antes de exibir |
| Faixa "Protótipo para aprovação" | Remover do rodapé na publicação |
| Número de caminhões (10) | Confirmar |

## 8. Fora do escopo

- Formulário de orçamento ou rastreio público do chamado (pode vir do sistema no futuro).
- Painel de administração do conteúdo: o site é estático e se edita pelos arquivos de `src/`.
- Hospedagem: ainda não definida (o domínio atual é thiagoguinchos.com).
