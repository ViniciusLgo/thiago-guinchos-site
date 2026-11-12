// Monta o index.html publicado a partir das fontes em src/.
//
//   node scripts/montar.mjs             gera index.html
//   node scripts/montar.mjs --verificar falha se index.html estiver desatualizado
//
// O script da cena 3D vai embutido no HTML para a página abrir com duplo clique
// (navegadores bloqueiam módulos JS externos em file://).
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const ler = (caminho) => readFileSync(join(raiz, caminho), "utf8");

const TAG_CENA = '<script type="module" src="assets/cena.js"></script>';

export function montar() {
  let html = ler("src/pagina.html");
  const trocas = [
    ["<!--CABECA-->", ler("src/cabeca.html")],
    ["<!--SIMBOLOS-->", ler("src/simbolos.html")],
    [TAG_CENA, `<script type="module">\n${ler("src/cena.js")}\n</script>`],
  ];
  for (const [marcador, conteudo] of trocas) {
    if (!html.includes(marcador)) throw new Error(`Marcador ausente em src/pagina.html: ${marcador}`);
    html = html.replace(marcador, () => conteudo);
  }
  return html;
}

const saida = join(raiz, "index.html");
const html = montar();

if (process.argv.includes("--verificar")) {
  const atual = existsSync(saida) ? readFileSync(saida, "utf8") : "";
  if (atual !== html) {
    console.error("index.html está desatualizado. Rode: npm run montar");
    process.exit(1);
  }
  console.log("index.html em dia com src/.");
} else {
  writeFileSync(saida, html);
  console.log(`index.html gerado (${(html.length / 1024).toFixed(0)} KB).`);
}
