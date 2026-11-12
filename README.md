<div align="center">

<img src="assets/logo-escuro.svg" alt="Thiago Guinchos" width="260">

# Site da Thiago Guinchos

**Guincho 24 horas em Camaçari/BA.** Página única, curta e direta, com o guincho em 3D contando o resgate do chamado à entrega.

[![Verificar](https://github.com/ViniciusLgo/thiago-guinchos-site/actions/workflows/verificar.yml/badge.svg)](https://github.com/ViniciusLgo/thiago-guinchos-site/actions/workflows/verificar.yml)
![HTML](https://img.shields.io/badge/HTML%20%2B%20CSS%20%2B%20JS-puro-F5B800)
![Three.js](https://img.shields.io/badge/Three.js-0.160.0-16181B)

</div>

<p align="center">
  <img src="docs/capturas/desktop-1-topo.png" alt="Topo do site no PC: guincho 3D na rodovia à noite e o título Guincho 24 horas" width="72%">
  <img src="docs/capturas/celular-1-topo.png" alt="Topo do site no celular" width="22%">
</p>

## O que é

O site institucional da [Thiago Guinchos](https://www.instagram.com/thiagoguinchosbr/). Quem chega aqui quase sempre está com o carro parado e no celular, por isso a página tem pouco texto e o botão do WhatsApp está sempre à vista.

| Seção | O que mostra |
|---|---|
| Abertura | Guincho 3D na rodovia, "Guincho 24 horas", WhatsApp e Ligar |
| **KM 01** Serviços | 6 serviços, cada um com ícone e poucas palavras |
| Seguradoras | Faixa rolando com as parceiras |
| **KM 02** Do chamado à entrega | A rolagem conduz o resgate em 4 etapas (abaixo) |
| **KM 03** Depoimentos | Carrossel com 10 depoimentos e fotos |
| **KM 04** Contato | Telefone em placa Mercosul, WhatsApp, endereço e Instagram |

### KM 02: o resgate

| 1. Pedido no pátio | 2. Na estrada | 3. Embarque | 4. Entregue |
|---|---|---|---|
| ![Pátio da Thiago Guinchos](docs/capturas/desktop-km02-a-etapa1-base.png) | ![Guincho na estrada com GPS](docs/capturas/desktop-km02-c-etapa3-estrada.png) | ![Carro subindo na plataforma](docs/capturas/desktop-km02-e-etapa4-embarque.png) | ![Check de entrega na oficina](docs/capturas/desktop-km02-g-etapa4-check.png) |

O pedido chega pelo WhatsApp, o giroflex acende e o guincho sai do pátio. A estrada tem postes, placas de km e coqueiros, com o alfinete de GPS seguindo o trajeto. No acostamento estão o carro com pisca-alerta, triângulo e capô aberto e o motorista ao celular. A plataforma inclina, o carro sobe e o guincho leva até a oficina.

## Como abrir

Dê **duplo clique em `index.html`**. Não precisa de servidor nem de instalação: o script da cena já vem embutido no arquivo. Só é preciso internet para carregar o Three.js e as fontes.

Para testar como num servidor de verdade (útil no celular, na mesma rede):

```bash
npm run servir   # http://localhost:4173
```

## Como editar

Não edite o `index.html` diretamente: ele é **gerado**. Edite os arquivos de `src/` e depois monte a página:

```bash
npm run montar      # gera index.html a partir de src/
npm run verificar   # confere se index.html está em dia (o GitHub roda isso a cada push)
```

| Para mudar... | Edite |
|---|---|
| Textos, seções, estilos | `src/pagina.html` |
| Título da aba, descrição no Google, Open Graph, dados estruturados | `src/cabeca.html` |
| Ícones | `src/simbolos.html` |
| Cenas 3D (topo e KM 02) | `src/cena.js` |
| Fotos, avatares, logo | `assets/` |

Para **trocar um depoimento de exemplo** pelo real: em `src/pagina.html`, procure `data-exemplo="true"`, troque nome, texto e avatar e apague esse atributo.

## Estrutura

```
index.html            página publicada (gerada; não editar)
src/
  pagina.html         HTML e CSS, com os marcadores <!--CABECA--> e <!--SIMBOLOS-->
  cabeca.html         <head>: título, SEO, Open Graph, fontes, JSON-LD
  simbolos.html       ícones SVG (<symbol>)
  cena.js             cenas 3D em Three.js: caminhão, carro, rodovia, pátio, câmera
assets/               logo, fotos e avatares
scripts/montar.mjs    junta src/ em index.html
docs/
  spec.md             o que o site é, roteiro do KM 02, identidade visual, critérios
  creditos.md         autores e licenças de fotos, avatares, fontes e bibliotecas
  capturas/           imagens usadas neste README
```

## Funciona em qualquer aparelho

- **Celular:** cena mais leve, só a etapa ativa do KM 02 na tela e barra fixa com WhatsApp e Ligar.
- **Movimento reduzido:** quem desliga animações no aparelho vê um quadro fixo com as 4 etapas.
- **Sem WebGL:** aparece uma ilustração em SVG no lugar do 3D.
- A animação só roda enquanto a seção está visível e para quando a aba fica em segundo plano.

## Antes de publicar

O conteúdo provisório está listado em [docs/spec.md](docs/spec.md#7-conteúdo-provisório-trocar-antes-de-publicar). Resumo:

- [ ] Trocar os 7 depoimentos de exemplo pelos reais
- [ ] Trocar as fotos ilustrativas por fotos da frota
- [ ] Confirmar "desde 2020", o número de caminhões e o CNPJ
- [ ] Tirar a faixa "Protótipo para aprovação" do rodapé
- [ ] Definir a hospedagem e apontar o domínio thiagoguinchos.com

## Projetos relacionados

- **[projetoGuincho](https://github.com/ViniciusLgo/projetoGuincho)**: o sistema da empresa (painel do gerente e app do motorista). O link "Site da empresa" do sistema aponta para este site.

## Créditos

Fotos do Unsplash, avatares DiceBear (CC0), Three.js (MIT) e fontes Barlow (OFL). Detalhes em [docs/creditos.md](docs/creditos.md).
