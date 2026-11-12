// Cenas 3D do site (Three.js, só primitivas, nenhum modelo externo):
//  1) topo: caminhão plataforma levando um carro numa rodovia à noite, ligado à rolagem até "Serviços";
//  2) KM 02: o mesmo caminhão sai do pátio, percorre uma estrada com curva, resgata um carro parado e leva até a oficina.
// Cada cena tem o próprio canvas e só é desenhada quando está visível.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const mqReduz = matchMedia('(prefers-reduced-motion: reduce)');
const leve = matchMedia('(max-width: 760px)').matches ||
  (matchMedia('(pointer: coarse)').matches && Math.min(screen.width, screen.height) < 820);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const faixa = (u, a, b) => clamp((u - a) / (b - a), 0, 1);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeBack = (t) => { const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
const tanH = Math.tan(THREE.MathUtils.degToRad(15));

function temWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (e) { return false; }
}

const aoCarregarFontes = [];

// ======================================================================
// Recursos compartilhados (texturas, materiais, construtores)
// ======================================================================
function recursos() {
  function tex(w, h, desenhar, srgb = true) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d'); desenhar(g, w, h);
    const t = new THREE.CanvasTexture(c);
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }
  // textura com texto: redesenha quando a Barlow Condensed termina de carregar
  function texTexto(w, h, desenhar) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d');
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    const pintar = () => { g.clearRect(0, 0, w, h); desenhar(g, w, h); t.needsUpdate = true; };
    pintar(); aoCarregarFontes.push(pintar);
    return t;
  }
  const fonte = (peso, px) => `${peso} ${px}px "Barlow Condensed", "Arial Narrow", sans-serif`;
  function gancho(g, x, y, s) {
    g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = '#F5B800'; g.beginPath(); g.roundRect(0, 0, 100, 100, 22); g.fill();
    g.fillStyle = '#111'; g.beginPath(); g.roundRect(30, 12, 40, 22, 5); g.fill();
    g.fillStyle = '#F5B800'; g.beginPath(); g.arc(50, 23, 5.5, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#111'; g.fillRect(44, 33, 12, 12);
    g.strokeStyle = '#111'; g.lineWidth = 11; g.lineCap = 'round';
    g.beginPath(); g.moveTo(50, 44); g.lineTo(50, 62); g.arc(50, 77, 15, -Math.PI / 2, Math.PI, false); g.stroke();
    g.restore();
  }
  function check(g, cx, cy, r, fundo, traco) {
    g.fillStyle = fundo; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fill();
    g.strokeStyle = traco; g.lineWidth = r * .22; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(cx - r * .42, cy + r * .02); g.lineTo(cx - r * .1, cy + r * .34); g.lineTo(cx + r * .46, cy - r * .3); g.stroke();
  }

  const T = {};
  T.ceu = tex(4, 512, (g, w, h) => {
    const l = g.createLinearGradient(0, 0, 0, h);
    l.addColorStop(0, '#05070a'); l.addColorStop(.45, '#0c1016'); l.addColorStop(.7, '#151a22');
    l.addColorStop(.84, '#232833'); l.addColorStop(.93, '#2e2a26'); l.addColorStop(1, '#191b1f');
    g.fillStyle = l; g.fillRect(0, 0, w, h);
  });
  T.brilho = tex(128, 128, (g) => {
    const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.22, 'rgba(255,255,255,.5)');
    r.addColorStop(.55, 'rgba(255,255,255,.12)'); r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r; g.fillRect(0, 0, 128, 128);
  });
  T.farol = tex(256, 128, (g, w, h) => {
    const a = g.createLinearGradient(0, 0, w, 0);
    a.addColorStop(0, 'rgba(255,255,255,.95)'); a.addColorStop(.35, 'rgba(255,255,255,.45)'); a.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = a; g.fillRect(0, 0, w, h);
    g.globalCompositeOperation = 'destination-in';
    const v = g.createLinearGradient(0, 0, 0, h);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(.5, 'rgba(0,0,0,1)'); v.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = v; g.fillRect(0, 0, w, h);
  });
  T.feixe = tex(4, 128, (g, w, h) => {
    const l = g.createLinearGradient(0, 0, 0, h);
    l.addColorStop(0, '#ffffff'); l.addColorStop(.35, '#5a5a5a'); l.addColorStop(1, '#000000');
    g.fillStyle = l; g.fillRect(0, 0, w, h);
  });
  T.anel = tex(256, 256, (g) => {
    g.strokeStyle = '#fff'; g.lineWidth = 10; g.beginPath(); g.arc(128, 128, 112, 0, Math.PI * 2); g.stroke();
    g.globalAlpha = .35; g.lineWidth = 26; g.beginPath(); g.arc(128, 128, 104, 0, Math.PI * 2); g.stroke();
  });
  T.zebra = tex(64, 64, (g) => {
    g.fillStyle = '#16181B'; g.fillRect(0, 0, 64, 64);
    g.fillStyle = '#F5B800';
    for (let i = -64; i < 128; i += 32) { g.beginPath(); g.moveTo(i, 64); g.lineTo(i + 16, 64); g.lineTo(i + 80, 0); g.lineTo(i + 64, 0); g.closePath(); g.fill(); }
  });
  T.zebra.wrapS = T.zebra.wrapT = THREE.RepeatWrapping;
  T.zebra.repeat.set(10, 1);
  T.adesivo = texTexto(256, 256, (g) => {
    gancho(g, 48, 18, 1.6);
    g.fillStyle = '#16181B'; g.font = fonte(800, 54); g.textAlign = 'center'; g.fillText('24 HORAS', 128, 240);
  });
  T.balao = texTexto(640, 300, (g) => {
    g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.roundRect(14, 20, 612, 214, 36); g.fill();
    g.fillStyle = '#ffffff'; g.beginPath(); g.roundRect(8, 8, 612, 214, 36); g.fill();
    g.beginPath(); g.moveTo(110, 214); g.lineTo(84, 290); g.lineTo(190, 214); g.fill();
    g.fillStyle = '#16181B'; g.beginPath(); g.arc(104, 115, 58, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#F5B800'; g.lineWidth = 9; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(80, 92); g.quadraticCurveTo(84, 140, 128, 142); g.stroke();
    g.fillStyle = '#F5B800'; g.beginPath(); g.roundRect(70, 80, 22, 26, 6); g.fill(); g.beginPath(); g.roundRect(118, 130, 26, 22, 6); g.fill();
    g.fillStyle = '#111317'; g.textAlign = 'left';
    g.font = fonte(800, 66); g.fillText('Olá! Preciso de', 186, 102);
    g.fillText('um guincho.', 186, 168);
    g.fillStyle = '#6b717c'; g.font = fonte(600, 30); g.fillText('agora · WhatsApp', 186, 206);
  });
  T.pino = tex(160, 220, (g) => {
    g.fillStyle = '#F5B800'; g.strokeStyle = '#111317'; g.lineWidth = 9;
    g.beginPath(); g.moveTo(80, 212); g.bezierCurveTo(40, 160, 10, 120, 10, 80); g.arc(80, 80, 70, Math.PI, 0); g.bezierCurveTo(150, 120, 120, 160, 80, 212); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#111317'; g.beginPath(); g.arc(80, 80, 24, 0, Math.PI * 2); g.fill();
  });
  T.pinoDestino = tex(160, 220, (g) => {
    g.fillStyle = '#ffffff'; g.strokeStyle = '#111317'; g.lineWidth = 9;
    g.beginPath(); g.moveTo(80, 212); g.bezierCurveTo(40, 160, 10, 120, 10, 80); g.arc(80, 80, 70, Math.PI, 0); g.bezierCurveTo(150, 120, 120, 160, 80, 212); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#111317'; g.fillRect(56, 50, 8, 64); g.fillStyle = '#F5B800'; g.fillRect(64, 50, 40, 26);
  });
  T.check = tex(256, 256, (g) => { check(g, 128, 128, 118, '#F5B800', '#111317'); });
  T.checkPequeno = tex(128, 128, (g) => { check(g, 64, 64, 58, '#F5B800', '#111317'); });
  T.placas = ['VOCÊ|CHAMA', 'ENVIAMOS O|MAIS PRÓXIMO', 'ACOMPA-|NHAMENTO', 'ENTREGA|SEGURA'].map((txt, i) => texTexto(512, 300, (g, w, h) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#111317'; g.lineWidth = 16; g.strokeRect(14, 14, w - 28, h - 28);
    g.fillStyle = i === 3 ? '#F5B800' : '#111317'; g.beginPath(); g.arc(120, 150, 78, 0, Math.PI * 2); g.fill();
    g.fillStyle = i === 3 ? '#111317' : '#ffffff'; g.font = fonte(800, 118); g.textAlign = 'center'; g.fillText(String(i + 1), 120, 192);
    g.fillStyle = '#111317'; g.textAlign = 'left'; g.font = fonte(800, 62);
    const [l1, l2] = txt.split('|'); let px = 62; g.font = fonte(800, px);
    while (px > 30 && Math.max(g.measureText(l1).width, g.measureText(l2).width) > 262) { px -= 2; g.font = fonte(800, px); }
    g.fillText(l1, 224, 140); g.fillText(l2, 224, 140 + px * 1.02);
    g.fillStyle = '#4A4F57'; g.font = fonte(700, 30); g.fillText('KM 02 · PARADA ' + (i + 1), 224, 76);
  }));
  T.letreiroBase = texTexto(512, 96, (g, w, h) => {
    g.fillStyle = '#111317'; g.fillRect(0, 0, w, h); gancho(g, 14, 10, .76);
    g.fillStyle = '#ffffff'; g.font = fonte(800, 52); g.textAlign = 'left'; g.fillText('THIAGO', 108, 66);
    g.fillStyle = '#F5B800'; g.fillText('GUINCHOS', 262, 66);
  });
  T.letreiroDestino = texTexto(512, 96, (g, w, h) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#111317'; g.font = fonte(800, 56); g.textAlign = 'center'; g.fillText('DESTINO · OFICINA', w / 2, 68);
  });

  const M = {
    branco: new THREE.MeshStandardMaterial({ color: 0xf2f2ee, roughness: .32, metalness: .12 }),
    amarelo: new THREE.MeshStandardMaterial({ color: 0xF5B800, roughness: .4, metalness: .1 }),
    escuro: new THREE.MeshStandardMaterial({ color: 0x1b1d21, roughness: .65, metalness: .35 }),
    metal: new THREE.MeshStandardMaterial({ color: 0x41464f, roughness: .42, metalness: .65 }),
    vidro: new THREE.MeshStandardMaterial({ color: 0x0a0d12, roughness: .06, metalness: .85 }),
    pneu: new THREE.MeshStandardMaterial({ color: 0x0c0d0f, roughness: .95 }),
    cubo: new THREE.MeshStandardMaterial({ color: 0xb4bac2, roughness: .3, metalness: .85 }),
    farol: new THREE.MeshBasicMaterial({ color: 0xfff4d6 }),
    lanterna: new THREE.MeshBasicMaterial({ color: 0xff2a1a }),
    carro: new THREE.MeshStandardMaterial({ color: 0x35506e, roughness: .25, metalness: .6 }),
    zebra: new THREE.MeshStandardMaterial({ map: T.zebra, roughness: .5 }),
    predio: new THREE.MeshStandardMaterial({ color: 0x2a2e35, roughness: .85, metalness: .1 }),
    farolCarro: new THREE.MeshStandardMaterial({ color: 0xdfe3e8, roughness: .2 }),
    lanternaCarro: new THREE.MeshStandardMaterial({ color: 0x7a1010, roughness: .3 }),
    folha: new THREE.MeshStandardMaterial({ color: 0x1f3a28, roughness: .9, flatShading: true }),
    folha2: new THREE.MeshStandardMaterial({ color: 0x2b4a2f, roughness: .9, flatShading: true }),
    tronco: new THREE.MeshStandardMaterial({ color: 0x3a2c22, roughness: 1 }),
    concreto: new THREE.MeshStandardMaterial({ color: 0x2b2e34, roughness: .95 }),
    pele: new THREE.MeshStandardMaterial({ color: 0xa8714a, roughness: .8 }),
    camisa: new THREE.MeshStandardMaterial({ color: 0xc0392b, roughness: .8 }),
    calca: new THREE.MeshStandardMaterial({ color: 0x2b3a55, roughness: .9 }),
    tela: new THREE.MeshBasicMaterial({ color: 0xbfe3ff }),
    porta: new THREE.MeshBasicMaterial({ color: 0xffd9a0 }),
    balizador: new THREE.MeshStandardMaterial({ color: 0xe8e8e4, roughness: .6 }),
    refletor: new THREE.MeshBasicMaterial({ color: 0xffb21a }),
  };

  function caixa(w, h, d, mat, x, y, z, raio = 0) {
    const g = raio ? new RoundedBoxGeometry(w, h, d, 2, raio) : new THREE.BoxGeometry(w, h, d);
    const m = new THREE.Mesh(g, mat); m.position.set(x, y, z); return m;
  }
  function brilho(cor, escala, opacidade = 1) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.brilho, color: cor, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: opacidade, fog: false }));
    s.scale.set(escala, escala, 1); return s;
  }
  function decal(w, d, textura, cor, opacidade, aditivo = true) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({
      map: textura, color: cor, transparent: true, opacity: opacidade, depthWrite: false,
      blending: aditivo ? THREE.AdditiveBlending : THREE.NormalBlending,
    }));
    m.rotation.x = -Math.PI / 2; return m;
  }
  function figura(textura, w, h, cor = 0xffffff) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: textura, color: cor, transparent: true, depthWrite: false, fog: false }));
    s.scale.set(w, h, 1); s.userData.base = [w, h]; return s;
  }
  const segRoda = leve ? 16 : 26;
  function roda(r, larg) {
    const g = new THREE.Group();
    const pneu = new THREE.Mesh(new THREE.CylinderGeometry(r, r, larg, segRoda), M.pneu); pneu.rotation.x = Math.PI / 2; g.add(pneu);
    const aro = new THREE.Mesh(new THREE.CylinderGeometry(r * .58, r * .58, larg + .02, segRoda), M.cubo); aro.rotation.x = Math.PI / 2; g.add(aro);
    const miolo = new THREE.Mesh(new THREE.CylinderGeometry(r * .2, r * .2, larg + .05, 10), M.escuro); miolo.rotation.x = Math.PI / 2; g.add(miolo);
    for (let i = 0; i < 3; i++) { const raio = caixa(r * 1.05, r * .09, larg + .04, M.escuro, 0, 0, 0); raio.rotation.z = i * Math.PI / 3; g.add(raio); }
    return g;
  }

  const kms = {};
  T.km = (n) => kms[n] || (kms[n] = texTexto(128, 160, (g, w, h) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h); g.strokeStyle = '#111317'; g.lineWidth = 8; g.strokeRect(6, 6, w - 12, h - 12);
    g.fillStyle = '#111317'; g.textAlign = 'center'; g.font = fonte(800, 40); g.fillText('KM', w / 2, 60); g.font = fonte(800, 64); g.fillText(String(n), w / 2, 128);
  }));
  T.oficina = texTexto(512, 96, (g, w, h) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#111317'; g.font = fonte(800, 60); g.textAlign = 'center'; g.fillText('OFICINA · DESTINO', w / 2, 70);
  });
  return { T, M, caixa, brilho, decal, figura, roda };
}

function novoRenderer(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, leve ? 1.25 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  return renderer;
}

function novaCena(R) {
  const cena = new THREE.Scene();
  cena.background = R.T.ceu;
  cena.fog = new THREE.Fog(new THREE.Color('#111419'), 45, 340);
  cena.add(new THREE.HemisphereLight(0x5a6c8c, 0x0b0c0e, 1.5));
  const chave = new THREE.DirectionalLight(0xe4ebf5, 1.4); chave.position.set(34, 16, 40); cena.add(chave);
  const lua = new THREE.DirectionalLight(0xaec3e8, 1.5); lua.position.set(-20, 30, 25); cena.add(lua);
  const contra = new THREE.DirectionalLight(0xffc27a, .55); contra.position.set(10, 8, -30); cena.add(contra);
  return cena;
}

// ----------------------------------------------------------------------
// Caminhão plataforma (frente para +X). A plataforma inclina e recua
// em torno do pivô P para embarcar/desembarcar o carro.
// ----------------------------------------------------------------------
const PIVO = { x: -.2, y: 1.4 }, TOPO_PLAT = 1.55;
function criarCaminhao(R, { luzes = true } = {}) {
  const { M, T, caixa, brilho, decal, roda } = R;
  const grupo = new THREE.Group();
  const corpo = new THREE.Group(); grupo.add(corpo);
  const rodas = [];

  const cab = new THREE.Group(); cab.position.set(2.4, 1.0, 0); corpo.add(cab);
  const perfil = new THREE.Shape();
  perfil.moveTo(0, 0); perfil.lineTo(2.25, 0); perfil.lineTo(2.32, .78); perfil.lineTo(2.2, 1.95);
  perfil.quadraticCurveTo(2.16, 2.36, 1.82, 2.38); perfil.lineTo(.12, 2.38); perfil.quadraticCurveTo(0, 2.38, 0, 2.26); perfil.lineTo(0, 0);
  const gCab = new THREE.ExtrudeGeometry(perfil, { depth: 2.2, bevelEnabled: true, bevelThickness: .07, bevelSize: .07, bevelSegments: 2, curveSegments: 8 });
  gCab.translate(0, 0, -1.1);
  cab.add(new THREE.Mesh(gCab, M.branco));
  const parabrisa = caixa(.04, .9, 2.06, M.vidro, 2.335, 1.43, 0); parabrisa.rotation.z = .102; cab.add(parabrisa);
  cab.add(caixa(.95, .78, 2.37, M.vidro, 1.62, 1.47, 0));
  cab.add(caixa(2.36, .15, 2.37, M.zebra, 1.17, .56, 0));
  cab.add(caixa(.05, .5, 1.5, M.escuro, 2.37, .38, 0));
  const farois = [];
  for (const z of [-.8, .8]) {
    cab.add(caixa(.05, .16, .38, M.farol, 2.37, .5, z));
    const b = brilho(0xfff1cf, 1.5, .95); b.position.set(2.5, .5, z); cab.add(b); farois.push(b);
  }
  cab.add(caixa(.32, .3, 2.44, M.escuro, 2.36, -.08, 0, .06));
  for (const s of [-1, 1]) {
    cab.add(caixa(.04, .04, .24, M.escuro, 2.22, 1.76, s * 1.24));
    cab.add(caixa(.07, .42, .14, M.escuro, 2.24, 1.58, s * 1.36));
    const ad = new THREE.Mesh(new THREE.PlaneGeometry(.92, .92), new THREE.MeshStandardMaterial({ map: T.adesivo, transparent: true, roughness: .5 }));
    ad.position.set(.58, 1.3, s * 1.182); if (s < 0) ad.rotation.y = Math.PI; cab.add(ad);
  }

  // giroflex
  cab.add(caixa(.36, .07, 1.5, M.escuro, 1.15, 2.47, 0));
  const lentes = [], brilhosGiro = [];
  for (const z of [-.38, .38]) {
    const mat = new THREE.MeshStandardMaterial({ color: 0x4a3500, emissive: 0xFFB000, emissiveIntensity: 1, roughness: .3 });
    lentes.push(mat);
    cab.add(caixa(.3, .15, .66, mat, 1.15, 2.58, z, .05));
    const b = brilho(0xffb000, 2.2, 1); b.position.set(1.15, 2.62, z); cab.add(b); brilhosGiro.push(b);
  }
  const pivo = new THREE.Group(); pivo.position.set(1.15, 2.6, 0); cab.add(pivo);
  const gFeixe = new THREE.ConeGeometry(1.25, 8, 20, 1, true);
  gFeixe.translate(0, -4, 0); gFeixe.rotateZ(Math.PI / 2);
  const matFeixe = new THREE.MeshBasicMaterial({ map: T.feixe, color: 0xffb000, transparent: true, opacity: .2, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
  pivo.add(new THREE.Mesh(gFeixe, matFeixe));
  const f2 = new THREE.Mesh(gFeixe, matFeixe); f2.rotation.y = Math.PI; pivo.add(f2);
  const luzGiro = luzes ? new THREE.PointLight(0xffb000, 26, 20, 1.3) : null;
  if (luzGiro) { luzGiro.position.set(1.4, .1, 0); pivo.add(luzGiro); }

  // chassi fixo
  corpo.add(caixa(8.9, .24, 1.1, M.escuro, 0, .88, 0));
  corpo.add(caixa(6.6, .26, 1.3, M.escuro, -1.1, 1.2, 0));
  corpo.add(caixa(.12, .3, 2.3, M.zebra, -4.5, .8, 0));
  for (const z of [-.95, .95]) {
    corpo.add(caixa(.04, .12, .28, M.lanterna, -4.58, .86, z));
    const b = brilho(0xff2a1a, .9, .85); b.position.set(-4.68, .86, z); corpo.add(b);
  }
  corpo.add(caixa(.13, 1.42, 2.3, M.escuro, 2.22, 2.2, 0));
  corpo.add(caixa(.17, .09, 2.36, M.amarelo, 2.22, 2.94, 0));
  const tanque = new THREE.Mesh(new THREE.CylinderGeometry(.3, .3, 1.0, 16), M.metal); tanque.rotation.z = Math.PI / 2; tanque.position.set(1.6, .74, .72); corpo.add(tanque);
  for (const s of [-1, 1]) corpo.add(caixa(1.1, .46, .34, M.escuro, -.25, .84, s * .82));

  // plataforma móvel (coordenadas relativas ao pivô)
  const plataforma = new THREE.Group(); plataforma.position.set(PIVO.x, PIVO.y, 0); corpo.add(plataforma);
  const px = (x) => x - PIVO.x, py = (y) => y - PIVO.y;
  plataforma.add(caixa(7.0, .2, 2.5, M.metal, px(-1.15), py(1.45), 0, .04));
  for (const s of [-1, 1]) plataforma.add(caixa(7.0, .08, .07, M.amarelo, px(-1.15), py(1.58), s * 1.24));
  const rampa = caixa(.6, .16, 2.5, M.metal, px(-4.88), py(1.36), 0); rampa.rotation.z = .32; plataforma.add(rampa);

  for (const x of [3.6, -1.3, -2.45]) for (const z of [-1.05, 1.05]) {
    const r = roda(.5, .38); r.position.set(x, .5, z); grupo.add(r); rodas.push({ obj: r, raio: .5 });
  }

  const sombra = decal(11.5, 3.6, T.brilho, 0x000000, .85, false); sombra.position.set(0, .02, 0); grupo.add(sombra);
  const facho = decal(11, 3.6, T.farol, 0xfff0c8, .5); facho.position.set(10.3, .03, 0); grupo.add(facho);
  const poca = decal(9, 9, T.brilho, 0xffb000, 0); poca.position.set(3.5, .035, 0); grupo.add(poca);
  grupo.position.z = 1.9;

  return {
    grupo, corpo, plataforma,
    rodar(x) { grupo.position.x = x; this.girarRodas(x); },
    girarRodas(d) { for (const r of rodas) r.obj.rotation.z = -d / r.raio; },
    // ligado: 0 (desligado) a 1
    giroflex(tempo, ligado = 1) {
      const ang = tempo * 6.2;
      pivo.rotation.y = ang;
      const a = Math.pow(Math.max(0, Math.cos(ang)), 3), b = Math.pow(Math.max(0, Math.cos(ang + Math.PI)), 3);
      lentes[0].emissiveIntensity = (.5 + a * 3.2) * ligado + .05; lentes[1].emissiveIntensity = (.5 + b * 3.2) * ligado + .05;
      brilhosGiro[0].material.opacity = (.25 + a * .75) * ligado; brilhosGiro[1].material.opacity = (.25 + b * .75) * ligado;
      const s0 = 1.6 + a * 1.6, s1 = 1.6 + b * 1.6;
      brilhosGiro[0].scale.set(s0, s0, 1); brilhosGiro[1].scale.set(s1, s1, 1);
      matFeixe.opacity = .2 * ligado; pivo.visible = ligado > .01;
      if (luzGiro) luzGiro.intensity = 26 * ligado;
      poca.material.opacity = (.05 + .12 * Math.abs(Math.sin(ang))) * ligado;
    },
    farol(f) { for (const b of farois) b.material.opacity = .95 * f; facho.material.opacity = .5 * f; },
    // t: 0 (deitada) a 1 (inclinada, recuada)
    inclinar(t) { plataforma.rotation.z = .3 * t; plataforma.position.x = PIVO.x - 1.0 * t; },
  };
}

function criarCarro(R) {
  const { M, caixa, roda } = R;
  const carro = new THREE.Group();
  const pc = new THREE.Shape();
  pc.moveTo(-2.1, .22); pc.lineTo(2.02, .22); pc.quadraticCurveTo(2.17, .24, 2.15, .5); pc.lineTo(2.08, .68);
  pc.lineTo(.95, .84); pc.lineTo(.3, 1.28); pc.lineTo(-.85, 1.3); pc.lineTo(-1.7, .9); pc.lineTo(-2.08, .84);
  pc.quadraticCurveTo(-2.19, .6, -2.1, .22);
  const gCarro = new THREE.ExtrudeGeometry(pc, { depth: 1.6, bevelEnabled: true, bevelThickness: .06, bevelSize: .06, bevelSegments: 2, curveSegments: 6 });
  gCarro.translate(0, 0, -.8);
  carro.add(new THREE.Mesh(gCarro, M.carro));
  const pj = new THREE.Shape();
  pj.moveTo(.86, .86); pj.lineTo(.28, 1.24); pj.lineTo(-.83, 1.26); pj.lineTo(-1.6, .9); pj.lineTo(.86, .86);
  const gJanela = new THREE.ExtrudeGeometry(pj, { depth: 1.7, bevelEnabled: true, bevelThickness: .03, bevelSize: .02, bevelSegments: 1 });
  gJanela.translate(0, 0, -.85);
  carro.add(new THREE.Mesh(gJanela, M.vidro));
  for (const z of [-.55, .55]) {
    carro.add(caixa(.05, .1, .34, M.farolCarro, 2.18, .55, z));
    carro.add(caixa(.05, .12, .3, M.lanternaCarro, -2.17, .62, z));
  }
  for (const x of [1.3, -1.3]) for (const z of [-.8, .8]) { const r = roda(.33, .26); r.position.set(x, .33, z); carro.add(r); }
  const motor = caixa(.95, .1, 1.4, M.escuro, 1.5, .8, 0); motor.visible = false; carro.add(motor);
  const capo = new THREE.Group(); capo.position.set(.95, .86, 0); carro.add(capo);
  capo.add(caixa(1.16, .05, 1.66, M.carro, .58, 0, 0)); capo.rotation.z = -.14;
  carro.userData = { capo, motor };
  return carro;
}

// ----------------------------------------------------------------------
// Rodovia: pista, faixas, tachões, defensa, postes e horizonte industrial
// ----------------------------------------------------------------------
function montarRodovia(cena, R, { X0, X1, passoLuz, semente = 7 }) {
  const { M, caixa, brilho, decal, T } = R;
  let s = semente;
  const rnd = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  const COMPR = X1 - X0, XM = (X0 + X1) / 2;
  const pista = new THREE.Mesh(new THREE.PlaneGeometry(COMPR, 8.8), new THREE.MeshStandardMaterial({ color: 0x24272d, roughness: .82, metalness: .05 }));
  pista.rotation.x = -Math.PI / 2; pista.position.set(XM, .005, 0); cena.add(pista);
  const acost = new THREE.Mesh(new THREE.PlaneGeometry(COMPR, 1.4), new THREE.MeshStandardMaterial({ color: 0x1a1c20, roughness: 1 }));
  acost.rotation.x = -Math.PI / 2; acost.position.set(XM, .006, 5.1); cena.add(acost);
  const matLinha = new THREE.MeshBasicMaterial({ color: 0xa9acb2 });
  for (const z of [-4.15, 4.15]) { const l = new THREE.Mesh(new THREE.PlaneGeometry(COMPR, .14), matLinha); l.rotation.x = -Math.PI / 2; l.position.set(XM, .012, z); cena.add(l); }

  const passo = 7, n = Math.ceil(COMPR / passo);
  const faixas = new THREE.InstancedMesh(new THREE.PlaneGeometry(3.2, .16), new THREE.MeshBasicMaterial({ color: 0xd2d4d8 }), n);
  const tachoes = new THREE.InstancedMesh(new THREE.BoxGeometry(.2, .05, .12), new THREE.MeshBasicMaterial({ color: 0xffc94a }), n);
  const mtx = new THREE.Matrix4(), q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0)), um = new THREE.Vector3(1, 1, 1);
  for (let i = 0; i < n; i++) {
    const x = X0 + i * passo;
    mtx.compose(new THREE.Vector3(x, .013, 0), q, um); faixas.setMatrixAt(i, mtx);
    mtx.makeTranslation(x + passo / 2, .03, 0); tachoes.setMatrixAt(i, mtx);
  }
  cena.add(faixas, tachoes);

  cena.add(caixa(COMPR, .32, .06, M.metal, XM, .78, -5.3));
  const passoPoste = leve ? 8 : 4, nP = Math.ceil(COMPR / passoPoste);
  const postes = new THREE.InstancedMesh(new THREE.BoxGeometry(.12, .8, .12), M.escuro, nP);
  for (let i = 0; i < nP; i++) { mtx.makeTranslation(X0 + i * passoPoste, .4, -5.36); postes.setMatrixAt(i, mtx); }
  cena.add(postes);

  const matCone = new THREE.MeshBasicMaterial({ map: T.feixe, color: 0xffcf8a, transparent: true, opacity: .09, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const gCone = new THREE.ConeGeometry(3.1, 6.9, 24, 1, true);
  const matCabeca = new THREE.MeshBasicMaterial({ color: 0xffe2b0 });
  for (let x = X0 + 10; x < X1; x += passoLuz) {
    const poste = new THREE.Mesh(new THREE.CylinderGeometry(.08, .11, 7.2, 8), M.metal); poste.position.set(x, 3.6, -6.4); cena.add(poste);
    cena.add(caixa(.1, .1, 2.8, M.metal, x, 7.15, -5.0));
    cena.add(caixa(.75, .12, .36, matCabeca, x, 7.06, -3.75));
    const b = brilho(0xffd59a, 3.2, .8); b.position.set(x, 6.95, -3.75); cena.add(b);
    const cone = new THREE.Mesh(gCone, matCone); cone.position.set(x, 3.5, -3.75); cena.add(cone);
    const p = decal(9, 7, T.brilho, 0xffc77a, .42); p.position.set(x, .02, -2.6); cena.add(p);
  }

  return horizonte(cena, R, { X0, X1, semente: s });
}

function horizonte(cena, R, { X0, X1, semente = 7 }) {
  const { caixa, brilho, T } = R;
  let s = semente;
  const rnd = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  const COMPR = X1 - X0, XM = (X0 + X1) / 2, mtx = new THREE.Matrix4();
  const chao = new THREE.Mesh(new THREE.PlaneGeometry(COMPR + 500, 720), new THREE.MeshStandardMaterial({ color: 0x0d0f12, roughness: 1 }));
  chao.rotation.x = -Math.PI / 2; chao.position.set(XM, 0, -300); cena.add(chao);
  const matPredio = new THREE.MeshBasicMaterial({ color: 0x0a0c10 });
  const piscas = [0, 1].map(() => new THREE.SpriteMaterial({ map: T.brilho, color: 0xff3b2f, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false }));
  const janelas = [];
  for (let x = X0 - 160; x < X1 + 160;) {
    const w = 10 + rnd() * 30, h = 5 + rnd() * 18, z = -235 - rnd() * 50;
    cena.add(caixa(w, h, 10, matPredio, x + w / 2, h / 2, z));
    if (!leve && rnd() > .8) for (let k = 0; k < 2; k++) janelas.push([x + 2 + rnd() * (w - 4), 1.5 + rnd() * (h - 3), z + 5.05]);
    if (rnd() > .6) {
      const hc = 30 + rnd() * 34, rc = 1 + rnd() * 1.2;
      const ch = new THREE.Mesh(new THREE.CylinderGeometry(rc * .75, rc, hc, 10), matPredio); ch.position.set(x + w * .5, hc / 2, z - 3); cena.add(ch);
      const sp = new THREE.Sprite(piscas[Math.floor(rnd() * 2)]); sp.scale.set(4.5, 4.5, 1); sp.position.set(x + w * .5, hc + 1, z - 3); cena.add(sp);
    }
    x += w + rnd() * 10;
  }
  if (janelas.length) {
    const jm = new THREE.InstancedMesh(new THREE.PlaneGeometry(1.3, .8), new THREE.MeshBasicMaterial({ color: 0xffcf7a }), janelas.length);
    janelas.forEach((p, i) => { mtx.makeTranslation(p[0], p[1], p[2]); jm.setMatrixAt(i, mtx); });
    cena.add(jm);
  }
  const xt = XM - 40;
  const tocha = new THREE.Mesh(new THREE.CylinderGeometry(.5, .8, 58, 8), matPredio); tocha.position.set(xt, 29, -250); cena.add(tocha);
  const chama = brilho(0xff8a1f, 18, .9); chama.position.set(xt, 60, -250); cena.add(chama);
  const chamaMiolo = brilho(0xffd27a, 6, 1); chamaMiolo.position.set(xt, 59, -249.5); cena.add(chamaMiolo);

  {
    const nE = leve ? 140 : 320, pos = new Float32Array(nE * 3);
    for (let i = 0; i < nE; i++) {
      const a = rnd() * Math.PI * 2, el = .08 + rnd() * .9, r = 340;
      pos[i * 3] = Math.cos(a) * Math.cos(el) * r + XM; pos[i * 3 + 1] = Math.sin(el) * r * .7 + 20; pos[i * 3 + 2] = Math.sin(a) * Math.cos(el) * r - 120;
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    cena.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xc9d3e6, size: 1.6, sizeAttenuation: false, fog: false, transparent: true, opacity: .75 })));
  }

  return {
    animar(tempo) {
      piscas[0].opacity = (Math.sin(tempo * 2.4) > .2) ? 1 : .15;
      piscas[1].opacity = (Math.sin(tempo * 2.4 + 2.1) > .2) ? 1 : .15;
      const fl = 1 + Math.sin(tempo * 13) * .08 + Math.sin(tempo * 31) * .05;
      chama.scale.set(18 * fl, 21 * fl, 1);
    },
  };
}

// ----------------------------------------------------------------------
// Câmera: enquadra um ponto da pista numa posição da tela
// ----------------------------------------------------------------------
function camera() {
  const cam = new THREE.PerspectiveCamera(30, 1, .5, 700);
  const alvo = new THREE.Vector3(), dir = new THREE.Vector3(), direita = new THREE.Vector3();
  // frac: fração da largura ocupada pelo caminhão; casa: posição horizontal (0..1); base: altura do chão (0 topo, 1 base)
  cam.enquadrar = (c, { frac, casa, base, yaw, pitch }) => {
    const halfW = 10.4 / (frac * 2), halfH = halfW / cam.aspect, dist = halfH / tanH;
    dir.set(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch));
    direita.set(Math.cos(yaw), 0, -Math.sin(yaw));
    alvo.set(c.x, (2 * base - 1) * halfH + 1.4, c.z).addScaledVector(direita, -(casa - .5) * 2 * halfW);
    cam.position.copy(alvo).addScaledVector(dir, dist);
    cam.lookAt(alvo);
    const far = dist + 420; if (Math.abs(cam.far - far) > 1) { cam.far = far; cam.updateProjectionMatrix(); }
    return halfW;
  };
  return cam;
}

// ----------------------------------------------------------------------
// Laço de renderização: só desenha quando o elemento está na tela e a aba visível
// ----------------------------------------------------------------------
function laco({ observado, marcarEm, quadro, estatico }) {
  let ativo = false, raf = 0, t0 = 0, visivel = false, pronto = false;
  const marcar = () => { if (!pronto) { pronto = true; marcarEm.classList.add('pronto'); } };
  function passo(agora) {
    const dtReal = Math.max(0, (agora - t0) / 1000 || 0); t0 = agora;
    quadro(Math.min(.05, dtReal), dtReal);
    marcar();
    if (ativo) raf = requestAnimationFrame(passo);
  }
  function controlar() {
    const deve = visivel && !document.hidden && !mqReduz.matches;
    if (deve && !ativo) { ativo = true; t0 = performance.now(); raf = requestAnimationFrame(passo); }
    else if (!deve && ativo) { ativo = false; cancelAnimationFrame(raf); }
    if (mqReduz.matches && visivel) { estatico(); marcar(); }
  }
  new IntersectionObserver((en) => { visivel = en[0].isIntersecting; controlar(); }, { rootMargin: '120px 0px' }).observe(observado);
  document.addEventListener('visibilitychange', controlar);
  if (mqReduz.addEventListener) mqReduz.addEventListener('change', controlar);
  return { controlar, redesenhar() { if (mqReduz.matches && visivel) { estatico(); marcar(); } } };
}

// ======================================================================
// Cena 1: topo
// ======================================================================
function cenaTopo(R) {
  const palco = document.querySelector('.palco');
  const canvas = document.getElementById('cena');
  const estrada = document.getElementById('inicio');
  const tituloServicos = document.getElementById('t-servicos');
  if (!palco || !canvas) return;

  const renderer = novoRenderer(canvas);
  const cena = novaCena(R);
  const rodovia = montarRodovia(cena, R, { X0: -180, X1: 300, passoLuz: leve ? 44 : 30, semente: 7 });
  const T = criarCaminhao(R);
  const carro = criarCarro(R); carro.position.set(-1.25, TOPO_PLAT, 0); T.corpo.add(carro);
  for (const x of [1.3, -1.3]) for (const z of [-.8, .8]) T.plataforma.add(R.caixa(.08, .05, .5, R.M.amarelo, -1.25 + x + .36 - PIVO.x, TOPO_PLAT + .03 - PIVO.y, z));
  cena.add(T.grupo);
  const cam = camera();

  const L = {};
  function enquadrar() {
    const w = palco.clientWidth || innerWidth, h = palco.clientHeight || innerHeight;
    renderer.setSize(w, h, false);
    const asp = w / h; cam.aspect = asp; cam.updateProjectionMatrix();
    const retrato = asp < .95;
    L.frac = retrato ? .84 : clamp(.37 + (1.6 - asp) * .08, .32, .48);
    L.casa = retrato ? .5 : .69; L.base = retrato ? .755 : .76;
    L.yaw = retrato ? .3 : .36; L.pitch = .085;
    L.viagem = retrato ? 60 : 90;
    L.halfW = 10.4 / (L.frac * 2);
  }

  let alvoP = 0, p = 0;
  function medir() {
    const r = tituloServicos.getBoundingClientRect();
    alvoP = clamp(scrollY / Math.max(1, r.top + scrollY - innerHeight * .1), 0, 1);
  }

  let tempo = 0, entrada = 0, ultimoX = 0, ultimaVar = -1;
  function atualizar(dt) {
    const W = p * L.viagem;
    const x = W - (1 - easeOut(entrada)) * (L.halfW * 2.6 + 14);
    T.rodar(x);
    const vel = dt > 0 ? Math.abs(x - ultimoX) / dt : 0; ultimoX = x;
    T.corpo.position.y = vel < .2 ? Math.sin(tempo * 44) * .006 : Math.sin(tempo * 17) * .01;
    T.giroflex(tempo, 1);
    rodovia.animar(tempo);
    const casa = L.casa + (1.5 - L.casa) * Math.pow(p, 2.8);
    cam.enquadrar({ x: W, z: 1.9 }, { ...L, casa });
    const v = Math.round(p * 200) / 200;
    if (v !== ultimaVar) { palco.style.setProperty('--p', v); ultimaVar = v; }
  }

  enquadrar(); medir();
  if (scrollY > 10) { entrada = 1; p = alvoP; }
  const ctl = laco({
    observado: estrada, marcarEm: palco,
    quadro(dt, dtReal) {
      tempo += dt;
      entrada = Math.min(1, entrada + Math.min(.25, dtReal) / 2.6);
      p += (alvoP - p) * (1 - Math.exp(-dt * 5));
      atualizar(dt);
      renderer.render(cena, cam);
    },
    estatico() { entrada = 1; tempo = .05; p = 0; atualizar(0); renderer.render(cena, cam); },
  });
  addEventListener('scroll', medir, { passive: true });
  addEventListener('resize', () => { enquadrar(); medir(); ctl.redesenhar(); });
  if ('ResizeObserver' in window) new ResizeObserver(() => { enquadrar(); ctl.redesenhar(); }).observe(palco);
  aoCarregarFontes.push(() => ctl.redesenhar());
  ctl.controlar();
  window.__cena3d = { info: () => renderer.info.render };
}

// ----------------------------------------------------------------------
// Pessoa simples (low-poly), de frente para +Z, com celular na mão
// ----------------------------------------------------------------------
function criarPessoa(R) {
  const { M, caixa, brilho } = R;
  const g = new THREE.Group();
  const pernas = [-.12, .12].map((x) => { const p = new THREE.Group(); p.position.set(x, .8, 0); p.add(caixa(.17, .8, .2, M.calca, 0, -.4, 0)); g.add(p); return p; });
  g.add(caixa(.52, .66, .3, M.camisa, 0, 1.13, 0, .06));
  g.add(caixa(.14, .6, .15, M.camisa, -.34, 1.12, 0));
  const braco = new THREE.Group(); braco.position.set(.34, 1.4, 0); braco.rotation.x = -2.4; g.add(braco);
  braco.add(caixa(.14, .58, .15, M.camisa, 0, -.27, 0));
  braco.add(caixa(.05, .17, .09, M.tela, 0, -.6, .02));
  const sol = new THREE.Mesh(new THREE.IcosahedronGeometry(.17, 1), M.pele); sol.position.set(0, 1.64, 0); g.add(sol);
  const luz = brilho(0xbfe3ff, .7, .8); luz.position.set(.3, 1.66, .2); g.add(luz);
  g.userData = { pernas, luz };
  return g;
}

// ----------------------------------------------------------------------
// Estrada com curvas: fitas de geometria ao longo de uma CatmullRom
// ----------------------------------------------------------------------
function estradaCurva(cena, R, pontos) {
  const { M } = R;
  const curva = new THREE.CatmullRomCurve3(pontos.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'centripetal');
  const L = curva.getLength(), N = Math.ceil(L / 1.5);
  const P = [], D = [];
  for (let i = 0; i <= N; i++) {
    const v = i / N, p = curva.getPointAt(v), t = curva.getTangentAt(v);
    P.push(p); D.push(new THREE.Vector3(-t.z, 0, t.x).normalize());
  }
  function fita(desvio, largura, y, mat) {
    const pos = new Float32Array((N + 1) * 6), idx = [];
    for (let i = 0; i <= N; i++) {
      const a = desvio - largura / 2, b = desvio + largura / 2, p = P[i], d = D[i];
      pos.set([p.x + d.x * a, y, p.z + d.z * a, p.x + d.x * b, y, p.z + d.z * b], i * 6);
      if (i < N) { const k = i * 2; idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    const m = new THREE.Mesh(g, mat); cena.add(m); return m;
  }
  fita(0, 8.8, .005, new THREE.MeshStandardMaterial({ color: 0x24272d, roughness: .82, metalness: .05, side: THREE.DoubleSide }));
  fita(5.1, 1.4, .006, new THREE.MeshStandardMaterial({ color: 0x1a1c20, roughness: 1, side: THREE.DoubleSide }));
  fita(-5.1, 1.4, .006, new THREE.MeshStandardMaterial({ color: 0x1a1c20, roughness: 1, side: THREE.DoubleSide }));
  const matLinha = new THREE.MeshBasicMaterial({ color: 0xa9acb2, side: THREE.DoubleSide });
  fita(-4.15, .14, .012, matLinha); fita(4.15, .14, .012, matLinha);

  const ponto = (s, desvio = 0) => {
    const v = clamp(s / L, 0, 1), p = curva.getPointAt(v), t = curva.getTangentAt(v);
    const d = new THREE.Vector3(-t.z, 0, t.x).normalize();
    return { pos: p.clone().addScaledVector(d, desvio), ang: Math.atan2(-t.z, t.x), dir: d };
  };
  const sDeX = (x) => { let melhor = 0, dm = 1e9; for (let i = 0; i <= N; i++) { const e = Math.abs(P[i].x - x); if (e < dm) { dm = e; melhor = i; } } return melhor / N * L; };

  const passo = 7, n = Math.floor(L / passo), dummy = new THREE.Object3D();
  const faixas = new THREE.InstancedMesh(new THREE.PlaneGeometry(3.2, .16), new THREE.MeshBasicMaterial({ color: 0xd2d4d8 }), n);
  const tachoes = new THREE.InstancedMesh(new THREE.BoxGeometry(.2, .05, .12), new THREE.MeshBasicMaterial({ color: 0xffc94a }), n);
  for (let i = 0; i < n; i++) {
    let q = ponto(i * passo); dummy.position.set(q.pos.x, .013, q.pos.z); dummy.rotation.set(-Math.PI / 2, q.ang, 0, 'YXZ'); dummy.updateMatrix(); faixas.setMatrixAt(i, dummy.matrix);
    q = ponto(i * passo + passo / 2); dummy.position.set(q.pos.x, .03, q.pos.z); dummy.rotation.set(0, q.ang, 0); dummy.updateMatrix(); tachoes.setMatrixAt(i, dummy.matrix);
  }
  cena.add(faixas, tachoes);

  // balizadores nos dois lados
  const passoB = leve ? 16 : 10, nb = Math.floor(L / passoB) * 2;
  const balizas = new THREE.InstancedMesh(new THREE.BoxGeometry(.14, .9, .14), M.balizador, nb);
  const refl = new THREE.InstancedMesh(new THREE.BoxGeometry(.16, .14, .16), M.refletor, nb);
  for (let i = 0, k = 0; k < nb; i++) for (const lado of [-6.0, 6.0]) {
    if (k >= nb) break;
    const q = ponto(i * passoB + 3, lado);
    dummy.position.set(q.pos.x, .45, q.pos.z); dummy.rotation.set(0, q.ang, 0); dummy.updateMatrix(); balizas.setMatrixAt(k, dummy.matrix);
    dummy.position.y = .78; dummy.updateMatrix(); refl.setMatrixAt(k, dummy.matrix); k++;
  }
  cena.add(balizas, refl);
  return { curva, L, ponto, sDeX };
}

// ======================================================================
// Cena 2: KM 02. O guincho sai do pátio da Thiago Guinchos, percorre a
// estrada com curva até um carro parado no acostamento, embarca o carro e
// leva até a oficina.
//  u 0.00–0.16  etapa 1: pedido chega na base pelo WhatsApp
//  u 0.16–0.38  etapa 2: giroflex liga, caminhão sai do pátio
//  u 0.38–0.62  etapa 3: estrada, alfinete de GPS e rota pontilhada até o carro
//  u 0.62–1.00  etapa 4: carro sobe na plataforma, segue até a oficina, check
// ======================================================================
function cenaEtapas(R) {
  const secao = document.getElementById('como-funciona');
  const canvas = document.getElementById('cena-etapas');
  if (!secao || !canvas) return;
  const trilho = secao.querySelector('.etapas-trilho');
  const cenaEl = secao.querySelector('.etapas-cena');
  const passos = [...secao.querySelectorAll('.passo')];
  const pontos = [...secao.querySelectorAll('.etapas-progresso .ponto')];
  const { M, T: TX, caixa, brilho, decal, figura } = R;
  let semente = 23;
  const rnd = () => { semente = (semente * 16807) % 2147483647; return (semente - 1) / 2147483646; };

  const renderer = novoRenderer(canvas);
  const cena = novaCena(R);
  const ceu = horizonte(cena, R, { X0: -90, X1: 260, semente: 11 });
  const pista = estradaCurva(cena, R, [[-90, 6], [-45, 3], [0, 0], [30, -1], [55, -6], [78, -15], [100, -20], [125, -19], [150, -13], [178, -9], [210, -8], [250, -11]]);
  const T = criarCaminhao(R); cena.add(T.grupo);
  const carro = criarCarro(R); cena.add(carro);
  const motorista = criarPessoa(R); cena.add(motorista);
  const cam = camera();
  const v1 = new THREE.Vector3();

  // ---------- pátio da Thiago Guinchos ----------
  const patio = new THREE.Mesh(new THREE.PlaneGeometry(46, 30), M.concreto); patio.rotation.x = -Math.PI / 2; patio.position.set(-2, .004, -25); cena.add(patio);
  const acesso = new THREE.Mesh(new THREE.PlaneGeometry(9, 6.2), M.concreto); acesso.rotation.x = -Math.PI / 2; acesso.position.set(1.3, .007, -7.2); cena.add(acesso);
  {
    const xs = []; for (let x = -24; x <= 22; x += 2.4) if (x < -4 || x > 6.6) xs.push(x);
    const postes = new THREE.InstancedMesh(new THREE.BoxGeometry(.1, 2.1, .1), M.metal, xs.length);
    xs.forEach((x, i) => { postes.setMatrixAt(i, new THREE.Matrix4().makeTranslation(x, 1.05, -10.2)); });
    cena.add(postes);
    for (const [a, b] of [[-24, -4.2], [6.6, 22]]) for (const y of [.7, 1.5, 2.05]) cena.add(caixa(b - a, .05, .05, M.metal, (a + b) / 2, y, -10.2));
    for (const x of [-4.3, 6.9]) cena.add(caixa(.45, 3.4, .45, M.zebra, x, 1.7, -10.2));
    cena.add(caixa(11.7, .3, .45, M.escuro, 1.3, 3.5, -10.2));
    const letreiro = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 1.35), new THREE.MeshBasicMaterial({ map: TX.letreiroBase, toneMapped: false }));
    letreiro.position.set(1.3, 4.45, -10.1); cena.add(letreiro);
    const bl = brilho(0xffe2b0, 9, .25); bl.position.set(1.3, 4.45, -10.6); cena.add(bl);
    // galpão
    cena.add(caixa(26, 7, 9, M.predio, -4, 3.5, -40));
    cena.add(caixa(26.05, .35, 9.05, M.amarelo, -4, 6.6, -40));
    [-12, -4, 4].forEach((x, i) => {
      const porta = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 4.6), i === 1 ? M.porta : M.escuro);
      porta.position.set(x, 2.3, -35.47); cena.add(porta);
    });
    const lz = brilho(0xffd59a, 10, .45); lz.position.set(-4, 2.5, -35); cena.add(lz);
    const fachada = new THREE.Mesh(new THREE.PlaneGeometry(10, 1.9), new THREE.MeshBasicMaterial({ map: TX.letreiroBase, toneMapped: false }));
    fachada.position.set(-4, 5.4, -35.46); cena.add(fachada);
    // luzes do pátio
    for (const [x, z] of [[-15, -16], [13, -28]]) {
      { const pl = new THREE.Mesh(new THREE.CylinderGeometry(.1, .14, 9, 8), M.metal); pl.position.set(x, 4.5, z); cena.add(pl); }
      cena.add(caixa(1.1, .2, .6, new THREE.MeshBasicMaterial({ color: 0xffe2b0 }), x, 9, z));
      const b = brilho(0xffd59a, 5, .8); b.position.set(x, 8.8, z); cena.add(b);
      const p = decal(22, 22, TX.brilho, 0xffc77a, .5); p.position.set(x, .02, z + 2); cena.add(p);
    }
    // outros caminhões estacionados
    for (const x of (leve ? [-10] : [-10, -17])) {
      const c = criarCaminhao(R, { luzes: false }); c.giroflex(0, 0); c.farol(0);
      c.grupo.position.set(x, 0, -24); c.grupo.rotation.y = -Math.PI / 2; cena.add(c.grupo);
    }
  }

  // ---------- percurso do caminhão ----------
  const sEntrada = pista.sDeX(16), sColeta = pista.sDeX(93), sFinal = pista.sDeX(176);
  const pts = [[1, -24], [1, -18], [1.1, -12], [2, -6.5], [5.2, -1.6], [10, .9]].map(([x, z]) => new THREE.Vector3(x, 0, z));
  for (let s = sEntrada; s <= sFinal + 14; s += 3) pts.push(pista.ponto(s, 1.9).pos);
  const caminho = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
  const LC = caminho.getLength();
  const amostrasC = caminho.getSpacedPoints(1200);
  const distAte = (p) => { let m = 0, dm = 1e9; amostrasC.forEach((q, i) => { const e = q.distanceToSquared(p); if (e < dm) { dm = e; m = i; } }); return m / 1200 * LC; };
  const dColeta = distAte(pista.ponto(sColeta, 1.9).pos), dFinal = distAte(pista.ponto(sFinal, 1.9).pos), dEstrada = distAte(pista.ponto(sEntrada, 1.9).pos);
  function poseEm(d, alvo) {
    const v = clamp(d / LC, 0, 1), p = caminho.getPointAt(v), t = caminho.getTangentAt(v);
    alvo.position.set(p.x, 0, p.z); alvo.rotation.set(0, Math.atan2(-t.z, t.x), 0); alvo.updateMatrixWorld(true);
  }
  const parada = new THREE.Object3D(); poseEm(dColeta, parada);
  const paradaFinal = new THREE.Object3D(); poseEm(dFinal, paradaFinal);

  // ---------- cenário ao longo da estrada ----------
  const passoLuz = leve ? 40 : 26;
  const matCone = new THREE.MeshBasicMaterial({ map: TX.feixe, color: 0xffcf8a, transparent: true, opacity: .09, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const gCone = new THREE.ConeGeometry(3.1, 6.9, 20, 1, true);
  const matCabeca = new THREE.MeshBasicMaterial({ color: 0xffe2b0 });
  for (let s = 30; s < pista.L - 10; s += passoLuz) {
    const q = pista.ponto(s, -6.6), g = new THREE.Group();
    g.position.copy(q.pos); g.rotation.y = q.ang; cena.add(g);
    const pst = new THREE.Mesh(new THREE.CylinderGeometry(.08, .11, 7.2, 8), M.metal); pst.position.set(0, 3.6, 0); g.add(pst);
    g.add(caixa(.1, .1, 2.8, M.metal, 0, 7.15, 1.4));
    g.add(caixa(.36, .12, .75, matCabeca, 0, 7.06, 2.65));
    const b = brilho(0xffd59a, 3.2, .8); b.position.set(0, 6.95, 2.65); g.add(b);
    const cone = new THREE.Mesh(gCone, matCone); cone.position.set(0, 3.5, 2.65); g.add(cone);
    const p = decal(9, 9, TX.brilho, 0xffc77a, .42); p.position.set(0, .02, 3.8); g.add(p);
  }
  // marcos de km (placa dupla face)
  [[45, 3], [85, 4], [125, 5], [165, 6], [205, 7]].forEach(([x, n]) => {
    const q = pista.ponto(pista.sDeX(x), 7.2), g = new THREE.Group(); g.position.copy(q.pos); g.rotation.y = q.ang + .5; cena.add(g);
    g.add(caixa(.08, 1.3, .08, M.metal, 0, .65, 0));
    const m = new THREE.MeshStandardMaterial({ map: TX.km(n), roughness: .5, emissive: 0xffffff, emissiveMap: TX.km(n), emissiveIntensity: .25 });
    g.add(caixa(.06, .9, .72, M.escuro, 0, 1.6, 0));
    for (const lado of [1, -1]) { const pl = new THREE.Mesh(new THREE.PlaneGeometry(.72, .9), m); pl.position.set(lado * .035, 1.6, 0); pl.rotation.y = lado * Math.PI / 2; g.add(pl); }
  });
  // placas das quatro etapas, do lado esquerdo
  const marcos = [[-9, -9.2, 0], ...[38, 70, 168].map((x) => { const q = pista.ponto(pista.sDeX(x), -8.5); return [q.pos.x, q.pos.z, q.ang - .25]; })].map(([x, z, a], i) => {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = a;
    for (const sx of [-1.25, 1.25]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, 3.4, 8), M.metal); p.position.set(sx, 1.7, 0); g.add(p); }
    const mat = new THREE.MeshStandardMaterial({ map: TX.placas[i], emissive: 0xffffff, emissiveMap: TX.placas[i], emissiveIntensity: .04, roughness: .5 });
    const painel = new THREE.Mesh(new THREE.BoxGeometry(3.4, 2.0, .08), [M.escuro, M.escuro, M.escuro, M.escuro, mat, M.escuro]);
    painel.position.set(0, 4.3, 0); g.add(painel);
    const halo = brilho(0xfff1cf, 7, 0); halo.position.set(0, 4.3, -.3); g.add(halo);
    const ok = figura(TX.checkPequeno, .9, .9); ok.position.set(1.65, 5.25, .2); ok.material.opacity = 0; g.add(ok);
    cena.add(g);
    return { mat, halo, ok, brilho: .04 };
  });

  // oficina (destino final), do lado esquerdo da parada final
  {
    const g = new THREE.Group(); g.position.copy(paradaFinal.position); g.rotation.copy(paradaFinal.rotation); cena.add(g);
    g.add(caixa(18, 5.5, 9, M.predio, 2, 2.75, -19));
    g.add(caixa(18.05, .3, 9.05, M.amarelo, 2, 5.2, -19));
    const porta = new THREE.Mesh(new THREE.PlaneGeometry(6, 4.2), M.porta); porta.position.set(-1, 2.1, -14.46); g.add(porta);
    const lt = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 1.35), new THREE.MeshBasicMaterial({ map: TX.oficina, toneMapped: false })); lt.position.set(6, 3.9, -14.45); g.add(lt);
    const pz = decal(16, 12, TX.brilho, 0xffc77a, .5); pz.position.set(-1, .02, -11); g.add(pz);
    const bz = brilho(0xffd59a, 8, .45); bz.position.set(-1, 2.4, -14); g.add(bz);
    const piso = new THREE.Mesh(new THREE.PlaneGeometry(12, 9), M.concreto); piso.rotation.x = -Math.PI / 2; piso.position.set(-1, .007, -10); g.add(piso);
  }

  // vegetação: árvores low-poly e coqueiros
  {
    const livre = (p) => {
      if (p.x > -30 && p.x < 28 && p.z < -6 && p.z > -48) return false;
      if (p.distanceTo(paradaFinal.position) < 26) return false;
      if (p.distanceTo(parada.position) < 18) return false;
      return true;
    };
    const posA = [];
    const nA = leve ? 55 : 150;
    for (let tent = 0; posA.length < nA && tent < nA * 6; tent++) {
      const s = rnd() * pista.L, longe = rnd() < .82;
      const off = longe ? -(12 + rnd() * 50) : (9.5 + rnd() * 3);
      const q = pista.ponto(s, off);
      if (!livre(q.pos)) continue;
      posA.push([q.pos, longe ? 1.2 + rnd() * 1.8 : .5 + rnd() * .35]);
    }
    const copa = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), M.folha, posA.length);
    const copa2 = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), M.folha2, posA.length);
    const tronco = new THREE.InstancedMesh(new THREE.CylinderGeometry(.12, .18, 1, 6), M.tronco, posA.length);
    const dm = new THREE.Object3D();
    posA.forEach(([p, e], i) => {
      dm.position.set(p.x, 1.2 * e + e * 1.1, p.z); dm.rotation.set(0, rnd() * 3, 0); dm.scale.set(e * 1.1, e * 1.3, e * 1.1); dm.updateMatrix();
      (i % 2 ? copa2 : copa).setMatrixAt(i, dm.matrix);
      (i % 2 ? copa : copa2).setMatrixAt(i, new THREE.Matrix4().makeScale(0, 0, 0));
      dm.position.set(p.x, .6 * e * 1.4, p.z); dm.scale.set(e, e * 1.4 * 1.2, e); dm.updateMatrix(); tronco.setMatrixAt(i, dm.matrix);
    });
    cena.add(copa, copa2, tronco);
    const nC = leve ? 4 : 12;
    const gFolha = new THREE.ConeGeometry(.32, 3.2, 4); gFolha.translate(0, 1.6, 0);
    for (let k = 0, tent = 0; k < nC && tent < 200; tent++) {
      const q = pista.ponto(20 + rnd() * (pista.L - 40), -(11 + rnd() * 22));
      if (!livre(q.pos)) continue; k++;
      const g = new THREE.Group(); g.position.copy(q.pos); cena.add(g);
      const h = 6 + rnd() * 3;
      const tr = new THREE.Mesh(new THREE.CylinderGeometry(.16, .26, h, 6), M.tronco); tr.position.y = h / 2; tr.rotation.z = (rnd() - .5) * .15; g.add(tr);
      for (let f = 0; f < 6; f++) {
        const fo = new THREE.Mesh(gFolha, M.folha2); fo.position.set(0, h, 0);
        fo.rotation.set(0, f / 6 * Math.PI * 2, 1.2 + rnd() * .3, 'YXZ'); fo.scale.set(1, 1, .35); g.add(fo);
      }
    }
  }

  // ---------- etapa 1: pedido chega na base ----------
  const balao = figura(TX.balao, 6.4, 3.0); balao.center.set(.5, 0); balao.position.set(1, 8.2, -27); cena.add(balao);
  const ondas = [0, 1].map(() => { const o = figura(TX.anel, 3, 3, 0xffc21a); o.material.blending = THREE.AdditiveBlending; o.position.set(-1.1, 9.8, -27); cena.add(o); return o; });
  const radar = decal(1, 1, TX.anel, 0xffc21a, 0); radar.position.y = .04; cena.add(radar);

  // ---------- carro parado: pisca-alerta, triângulo, capô aberto, fumaça, motorista ----------
  const G = { x: -9.4, z: 3.0 };
  const alerta = [[2.1, .55, .75], [2.1, .55, -.75], [-2.1, .62, .75], [-2.1, .62, -.75]].map(([x, y, z]) => { const b = brilho(0xffa21a, 1.2, 0); b.position.set(x + Math.sign(x) * .1, y, z); carro.add(b); return b; });
  const fumaca = [0, 1, 2, 3, 4].map(() => { const f = new THREE.Sprite(new THREE.SpriteMaterial({ map: TX.brilho, color: 0x9aa0a8, transparent: true, depthWrite: false, opacity: 0 })); carro.add(f); return f; });
  const tri = new THREE.Shape(); tri.moveTo(-.4, 0); tri.lineTo(.4, 0); tri.lineTo(0, .7); tri.lineTo(-.4, 0);
  const furo = new THREE.Path(); furo.moveTo(-.22, .1); furo.lineTo(.22, .1); furo.lineTo(0, .5); furo.lineTo(-.22, .1); tri.holes.push(furo);
  const triangulo = new THREE.Mesh(new THREE.ExtrudeGeometry(tri, { depth: .04, bevelEnabled: false }), new THREE.MeshStandardMaterial({ color: 0xe0281e, emissive: 0xe0281e, emissiveIntensity: .6 }));
  triangulo.position.copy(parada.localToWorld(v1.set(G.x - 4.8, .02, G.z))); triangulo.rotation.y = parada.rotation.y + Math.PI / 2 + .4; cena.add(triangulo);
  const brilhoTri = brilho(0xff3b2f, 1.6, .35); brilhoTri.position.copy(triangulo.position).setY(.4); cena.add(brilhoTri);
  const motIni = new THREE.Vector3(G.x + 1.2, 0, G.z + 1.9), motFim = new THREE.Vector3(3.2, 0, 1.6);

  // ---------- etapa 3/4: GPS, rota, destinos e check ----------
  const gps = figura(TX.pino, 1.6, 2.2); gps.center.set(.5, 0); cena.add(gps);
  const gpsHalo = brilho(0xffc21a, 4, 0); cena.add(gpsHalo);
  const pinoCarro = figura(TX.pinoDestino, 1.5, 2.0); pinoCarro.center.set(.5, 0); cena.add(pinoCarro);
  const pinoOficina = figura(TX.pinoDestino, 1.5, 2.0); pinoOficina.center.set(.5, 0); pinoOficina.position.copy(paradaFinal.localToWorld(v1.set(-1, 6.2, -12))); cena.add(pinoOficina);
  const dsRota = []; for (let d = dEstrada; d <= dFinal + 2; d += 1.6) dsRota.push(d);
  const rota = new THREE.InstancedMesh(new THREE.CircleGeometry(.22, 10), new THREE.MeshBasicMaterial({ color: 0xffc21a, fog: false }), dsRota.length);
  const posRota = dsRota.map((d) => caminho.getPointAt(clamp(d / LC, 0, 1)));
  cena.add(rota);
  const mtx = new THREE.Matrix4(), qChao = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0)), vPos = new THREE.Vector3(), vEsc = new THREE.Vector3();
  const cabo = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), new THREE.LineBasicMaterial({ color: 0x9aa0a8 }));
  T.corpo.add(cabo);
  const ok = figura(TX.check, 2.6, 2.6); ok.center.set(.5, 0); cena.add(ok);
  const okChao = decal(9, 9, TX.anel, 0xffc21a, 0); okChao.position.y = .05; cena.add(okChao);

  function pontoPlataforma(c, y, t) {
    const th = .3 * t, d = 1.0 * t, cs = Math.cos(th), sn = Math.sin(th);
    return { x: PIVO.x + cs * (c - PIVO.x) - sn * (y - PIVO.y) - d, y: PIVO.y + sn * (c - PIVO.x) + cs * (y - PIVO.y), rot: th };
  }
  function poseCarro(k, t) {
    if (k >= .45) { const c = lerp(-3.9, -1.25, (k - .45) / .55); const q = pontoPlataforma(c, TOPO_PLAT, t); return { x: q.x, y: q.y, z: 0, rot: q.rot }; }
    const a = k / .45, q = pontoPlataforma(-3.9, TOPO_PLAT, t);
    return { x: lerp(G.x, q.x, a), y: lerp(0, q.y, a), z: lerp(G.z, 0, a), rot: q.rot * a };
  }
  const forma = (v) => (v < .25 ? v / .25 : v > .75 ? (1 - v) / .25 : 1);

  // ---------- enquadramento ----------
  const L = {};
  let animado = !mqReduz.matches;
  function enquadrar() {
    secao.classList.toggle('animado', animado);
    const w = cenaEl.clientWidth || innerWidth, h = cenaEl.clientHeight || innerHeight;
    renderer.setSize(w, h, false);
    cam.aspect = w / h; cam.updateProjectionMatrix();
    L.retrato = cam.aspect < .95;
    L.mult = L.retrato ? 2.35 : 1;
    if (!animado) Object.assign(L, { casa: .5, base: .72 });
    else if (L.retrato) Object.assign(L, { casa: .5, base: .6 });
    else Object.assign(L, { casa: .55, base: .56 });
    L.yaw = .5; L.pitch = .17;
  }

  let alvoU = 0, u = 0;
  function medir() {
    const r = trilho.getBoundingClientRect();
    alvoU = clamp(-r.top / Math.max(1, trilho.offsetHeight - innerHeight), 0, 1);
  }

  const camAlvo = new THREE.Vector3(1, 0, -21), camDesejo = new THREE.Vector3(), carroMundo = new THREE.Vector3();
  let fracAtual = .2, tempo = 0, etapaUI = -1, ultimaB = -1, iniciado = false;
  function atualizar(dt, imediato) {
    // distância percorrida no caminho
    let d;
    if (u < .62) d = dColeta * easeInOut(faixa(u, .19, .62));
    else if (u < .79) d = dColeta;
    else d = lerp(dColeta, dFinal, easeInOut(faixa(u, .79, .94)));
    poseEm(d, T.grupo); T.girarRodas(d);
    const andando = (u > .19 && u < .62) || (u > .79 && u < .94);
    T.corpo.position.y = andando ? Math.sin(tempo * 17) * .01 : Math.sin(tempo * 44) * .006;
    T.giroflex(tempo, faixa(u, .15, .19));
    T.farol(.15 + .85 * faixa(u, .15, .2));

    // plataforma e carro
    let t = 0, k = 0;
    if (u >= .63 && u < .76) { const v = faixa(u, .63, .755); t = forma(v); k = faixa(v, .25, .75); }
    else if (u >= .76) k = 1;
    t = easeInOut(t); k = easeInOut(k);
    T.inclinar(t);
    const pose = poseCarro(k, t);
    const ref = u < .62 ? parada : T.grupo;
    carro.position.copy(ref.localToWorld(v1.set(pose.x, pose.y, pose.z)));
    carro.rotation.set(0, ref.rotation.y, pose.rot);
    carroMundo.copy(carro.position);
    const puxando = t > .5 && k > 0 && k < 1;
    cabo.visible = puxando;
    if (puxando) {
      const a = pontoPlataforma(2.0, 1.78, t), cs = Math.cos(pose.rot), sn = Math.sin(pose.rot);
      const ps = cabo.geometry.attributes.position;
      ps.setXYZ(0, a.x, a.y, 0); ps.setXYZ(1, pose.x + cs * 2.15 - sn * .45, pose.y + sn * 2.15 + cs * .45, pose.z); ps.needsUpdate = true;
    }
    // capô, fumaça, pisca-alerta, triângulo
    const parado = u < .64;
    const fechar = faixa(u, .62, .645);
    carro.userData.capo.rotation.z = lerp(.95, -.14, fechar);
    carro.userData.motor.visible = fechar < 1;
    fumaca.forEach((f, i) => {
      const fz = (tempo * .35 + i / fumaca.length) % 1, sc = .6 + fz * 1.8;
      f.position.set(1.5 + fz * .3, .95 + fz * 2.6, Math.sin(i * 2 + fz * 3) * .3); f.scale.set(sc, sc, 1);
      f.material.opacity = parado ? .42 * (1 - fz) * Math.min(1, fz * 5) : 0;
    });
    const piscaAlerta = u < .77 ? ((Math.sin(tempo * 9) > 0) ? 1 : .08) : 0;
    for (const b of alerta) b.material.opacity = piscaAlerta;
    triangulo.visible = u < .77; brilhoTri.material.opacity = u < .77 ? .25 + .2 * Math.sin(tempo * 9) : 0;

    // motorista: fala ao celular, depois entra na cabine
    const anda = faixa(u, .755, .79);
    motorista.visible = anda < 1;
    const pm = v1.copy(motIni).lerp(motFim, anda);
    motorista.position.copy(parada.localToWorld(pm));
    const dirAnda = Math.atan2(motFim.x - motIni.x, motFim.z - motIni.z);
    motorista.rotation.y = parada.rotation.y + (anda > 0 && anda < 1 ? dirAnda : -.6);
    const passoPe = anda > 0 && anda < 1 ? Math.sin(tempo * 11) * .5 : 0;
    motorista.userData.pernas[0].rotation.x = passoPe; motorista.userData.pernas[1].rotation.x = -passoPe;
    motorista.userData.luz.material.opacity = u < .2 ? .5 + .5 * Math.sin(tempo * 8) : .5;

    // etapa 1
    const e1 = 1 - faixa(u, .14, .2);
    balao.visible = e1 > .01; balao.material.opacity = e1;
    const pulso = 1 + Math.sin(tempo * 4) * .04;
    balao.scale.set(6.4 * pulso, 3.0 * pulso, 1); balao.position.y = 8.2 + Math.sin(tempo * 2) * .15;
    ondas.forEach((o, i) => { const f = (tempo * .8 + i * .5) % 1, sz = 2 + f * 5; o.scale.set(sz, sz, 1); o.material.opacity = (1 - f) * .55 * e1; o.visible = e1 > .01; });
    // etapa 2
    const e2 = faixa(u, .16, .19) * (1 - faixa(u, .3, .34));
    const fr = (tempo * .9) % 1, sr = 3 + fr * 30;
    radar.visible = e2 > .01; radar.scale.set(sr, sr, 1); radar.material.opacity = (1 - fr) * .6 * e2;
    radar.position.set(T.grupo.position.x, .04, T.grupo.position.z);
    // etapa 3: GPS acompanhando e rota pontilhada
    const e3 = faixa(u, .3, .36) * (1 - faixa(u, .95, .99));
    gps.visible = e3 > .01; gps.material.opacity = e3;
    gps.position.copy(T.grupo.localToWorld(v1.set(2.6, 4.2 + Math.sin(tempo * 3) * .15, 0))); gps.scale.set(1.6 * e3, 2.2 * e3, 1);
    gpsHalo.position.copy(gps.position).setY(gps.position.y + .9); gpsHalo.material.opacity = e3 * (.35 + .25 * Math.sin(tempo * 3));
    const vCarro = faixa(u, .26, .3) * (1 - faixa(u, .63, .66));
    pinoCarro.visible = vCarro > .01; pinoCarro.material.opacity = vCarro;
    pinoCarro.position.set(carroMundo.x, 2.2 + Math.sin(tempo * 3 + 1) * .12, carroMundo.z);
    const vOf = faixa(u, .77, .8) * (1 - faixa(u, .94, .97));
    pinoOficina.visible = vOf > .01; pinoOficina.material.opacity = vOf; pinoOficina.position.y = 6.2 + Math.sin(tempo * 3) * .15;
    const destinoRota = u < .66 ? dColeta : dFinal;
    const rotaVis = Math.max(e3 * (u < .66 ? 1 : 0), vOf);
    posRota.forEach((p, i) => {
      const e = (rotaVis > .01 && dsRota[i] > d + 5.4 && dsRota[i] <= destinoRota + .5) ? rotaVis : 0;
      vPos.set(p.x, .05, p.z); vEsc.set(e, e, e); mtx.compose(vPos, qChao, vEsc); rota.setMatrixAt(i, mtx);
    });
    rota.instanceMatrix.needsUpdate = true;
    // etapa 4: check na chegada
    const e4 = faixa(u, .94, .98);
    ok.visible = e4 > 0; const so = 3 * easeBack(e4); ok.scale.set(so, so, 1);
    ok.position.copy(T.grupo.localToWorld(v1.set(-1, 5.2 + Math.sin(tempo * 2.4) * .1, 0)));
    okChao.material.opacity = e4 * (.35 + .15 * Math.sin(tempo * 3)); okChao.position.set(T.grupo.position.x, .05, T.grupo.position.z);

    // placas e interface
    const etapa = u < .16 ? 0 : u < .38 ? 1 : u < .62 ? 2 : 3;
    marcos.forEach((m, i) => {
      const alvo = !animado ? .5 : i === etapa ? 1.0 : i < etapa ? .35 : .04;
      m.brilho += (alvo - m.brilho) * (imediato ? 1 : .12);
      m.mat.emissiveIntensity = m.brilho * .9;
      m.halo.material.opacity = Math.max(0, m.brilho - .4) * .5;
      const feito = i < etapa || (i === 3 && e4 > .5);
      m.ok.material.opacity += ((feito ? 1 : 0) - m.ok.material.opacity) * (imediato ? 1 : .15);
    });
    ceu.animar(tempo);

    // câmera: segue o caminhão com atraso suave; abre no pátio e no resgate
    const foco = faixa(u, .6, .65) * (1 - faixa(u, .77, .8));
    camDesejo.copy(T.grupo.position).lerp(carroMundo, .4 * foco);
    if (u < .2) camDesejo.lerp(v1.set(-3, 0, -20), .45);
    const fimF = faixa(u, .88, .95);
    if (fimF > 0) camDesejo.lerp(paradaFinal.localToWorld(v1.set(-2, 0, -9)), .45 * fimF);
    const fracAlvo = (u < .2 ? .2 : foco > .01 ? lerp(.29, .24, foco) : lerp(.29, .22, fimF)) * L.mult;
    const kf = imediato || !iniciado ? 1 : 1 - Math.exp(-dt * 5);
    camAlvo.lerp(camDesejo, kf); fracAtual += (fracAlvo - fracAtual) * kf; iniciado = true;
    cam.enquadrar(camAlvo, { frac: Math.min(.9, fracAtual), casa: L.casa, base: L.base, yaw: L.yaw, pitch: L.pitch });

    if (animado) {
      if (etapa !== etapaUI) {
        etapaUI = etapa;
        passos.forEach((el, i) => { el.classList.toggle('ativa', i === etapa); el.classList.toggle('feita', i < etapa); });
        pontos.forEach((el, i) => { el.classList.toggle('ativo-p', i === etapa); el.classList.toggle('feito-p', i < etapa); });
      }
      const b = u < .16 ? lerp(0, 1 / 3, u / .16) : u < .38 ? lerp(1 / 3, 2 / 3, (u - .16) / .22) : u < .62 ? lerp(2 / 3, 1, (u - .38) / .24) : 1;
      const br = Math.round(b * 300) / 300;
      if (br !== ultimaB) { secao.style.setProperty('--b', br); ultimaB = br; }
    }
  }

  enquadrar(); medir(); u = alvoU;
  const ctl = laco({
    observado: trilho, marcarEm: cenaEl,
    quadro(dt) {
      tempo += dt;
      u += (alvoU - u) * (1 - Math.exp(-dt * 6));
      atualizar(dt, false);
      renderer.render(cena, cam);
    },
    estatico() {
      // movimento reduzido: um quadro fixo da etapa 3 (estrada, GPS e rota até o carro parado)
      tempo = .3; u = .5;
      atualizar(0, true);
      renderer.render(cena, cam);
    },
  });
  addEventListener('scroll', medir, { passive: true });
  addEventListener('resize', () => { enquadrar(); medir(); ctl.redesenhar(); });
  if ('ResizeObserver' in window) new ResizeObserver(() => { enquadrar(); ctl.redesenhar(); }).observe(cenaEl);
  if (mqReduz.addEventListener) mqReduz.addEventListener('change', () => {
    animado = !mqReduz.matches;
    if (!animado) passos.forEach((el) => el.classList.remove('ativa', 'feita'));
    etapaUI = -1; enquadrar(); medir(); ctl.controlar();
  });
  aoCarregarFontes.push(() => ctl.redesenhar());
  ctl.controlar();
  window.__cenaEtapas = { info: () => renderer.info.render, u: () => u };
}

// ---------- início ----------
if (temWebGL()) {
  let R = null;
  try { R = recursos(); } catch (e) { console.warn('Cenas 3D desativadas:', e); }
  if (R) {
    try { cenaTopo(R); } catch (e) { console.warn('Cena do topo desativada:', e); }
    try { cenaEtapas(R); } catch (e) { console.warn('Cena das etapas desativada:', e); }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => aoCarregarFontes.forEach((f) => f()));
  }
}

