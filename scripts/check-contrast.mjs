// Vérifie que les couleurs de src/index.css passent WCAG AA (4.5:1) DANS LA
// PAIRE OÙ ELLES SONT RÉELLEMENT UTILISÉES.
//
// Pourquoi ce script existe : les valeurs précédentes passaient sur blanc
// mais échouaient là où elles servent vraiment — le texte d'un badge sur SON
// PROPRE fond teinté (--success 4,38:1, --amber 4,08:1), et --muted-foreground
// à 3,41:1 en clair / 3,83:1 en sombre alors que c'est la couleur de tous les
// libellés de champ, fils d'ariane et cellules secondaires, souvent à 11px.
// Vérifier « sur blanc » ne l'aurait jamais montré.
//
//   node scripts/check-contrast.mjs
//
// Sort en code 1 si une paire échoue, pour pouvoir être branché sur un hook.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postcss from 'postcss';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

// --- 0. Le fichier est-il seulement du CSS valide ? ------------------------
// `npm run build` NE DETECTE PAS les erreurs de syntaxe de ce fichier : il sort
// en code 0 et emet quand meme un bundle. Une erreur reelle (un `*/` accidentel
// au milieu d'un commentaire, ferme par `.badge-*/`) n'est apparue que dans
// l'overlay du serveur de dev, c'est-a-dire dans le navigateur. Ce controle
// remet un vrai garde-fou en amont.
{
  const raw = fs.readFileSync(path.join(ROOT, 'src/index.css'), 'utf8');
  try {
    postcss.parse(raw, { from: 'src/index.css' });
  } catch (err) {
    console.error(`\nsrc/index.css : erreur de syntaxe CSS\n  ${err.message}\n`);
    process.exit(1);
  }
}
// Les commentaires sont retirés AVANT toute analyse : ce fichier documente ses
// tokens abondamment, et une prose du type « ... aliase --brand: une seule
// couleur ... churn; » se fait sinon capturer comme une déclaration réelle et
// écrase la vraie valeur (constaté).
const css = fs.readFileSync(path.join(ROOT, 'src/index.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

/** Extrait les custom properties d'un bloc (`:root` ou `.dark`). */
function tokens(selector) {
  const start = css.indexOf(`${selector} {`);
  if (start === -1) throw new Error(`bloc ${selector} introuvable dans src/index.css`);
  const open = css.indexOf('{', start);
  let depth = 0;
  let i = open;
  for (; i < css.length; i++) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}') { depth--; if (depth === 0) break; }
  }
  const body = css.slice(open + 1, i);
  const out = {};
  for (const m of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) out[m[1]] = m[2].trim();
  return out;
}

const parseColor = (v, scope) => {
  v = v.trim();
  const varRef = v.match(/^var\((--[\w-]+)\)$/);
  if (varRef) return parseColor(scope[varRef[1]], scope);
  let m = v.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (m) {
    let h = m[1];
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    return { rgb: [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)), a: 1 };
  }
  m = v.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+))?\s*\)$/i);
  if (m) return { rgb: [+m[1], +m[2], +m[3]], a: m[4] === undefined ? 1 : +m[4] };
  return null; // oklch() et autres : hors périmètre de ce contrôle
};

const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
const over = ({ rgb, a }, bg) => rgb.map((c, i) => Math.round(c * a + bg[i] * (1 - a)));

const AA = 4.5;
let failures = 0;

function check(label, fgRaw, bgRgb, scope) {
  const fg = parseColor(fgRaw, scope);
  if (!fg) return;
  const r = ratio(over(fg, bgRgb), bgRgb);
  const ok = r >= AA;
  if (!ok) failures++;
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${label.padEnd(46)} ${r.toFixed(2).padStart(6)}:1`);
}

for (const [name, selector, cardRaw] of [
  ['CLAIR', ':root', '#ffffff'],
  ['SOMBRE', '.dark', '#18171d'],
]) {
  const t = tokens(selector);
  const card = parseColor(t['--card'] ?? cardRaw, t).rgb;
  console.log(`\n--- ${name} (fond --card ${t['--card'] ?? cardRaw}) ---`);

  // Texte courant sur la surface.
  for (const tok of ['--muted-foreground', '--text', '--text-muted', '--foreground', '--brand', '--sec-accent']) {
    if (t[tok]) check(`${tok} sur --card`, t[tok], card, t);
  }

  // Texte de badge sur SON PROPRE fond teinté — le cas des pastilles hors
  // grille (fiches, bandeaux), où la pilule est conservée.
  for (const tok of ['--success', '--warning', '--amber', '--info', '--destructive']) {
    const bgTok = `${tok}-bg`;
    if (!t[tok] || !t[bgTok]) continue;
    const tint = parseColor(t[bgTok], t);
    if (!tint) continue;
    check(`${tok} sur ${bgTok}`, t[tok], over(tint, card), t);
  }

  // Les mêmes tons **directement sur la carte**, sans leur teinte.
  //
  // Devenu le cas réel en contexte de grille : `index.css` dépouille les
  // pastilles dans une cellule de tableau — plus de fond, la couleur du ton
  // portée par le texte seul. Ce sont donc ces paires-là que voient les
  // écrans de liste, et elles n'étaient pas couvertes : le bloc au-dessus ne
  // vérifiait que le ton sur sa propre teinte, qui est *plus* contrastée que
  // sur la carte. Un ton qui passait là pouvait échouer ici.
  for (const tok of ['--success', '--warning', '--amber', '--info', '--destructive', '--brand']) {
    if (t[tok]) check(`${tok} sur --card (grille)`, t[tok], card, t);
  }

  // Texte posé sur un aplat plein.
  if (t['--brand'] && t['--brand-contrast']) {
    check('--brand-contrast sur aplat --brand', t['--brand-contrast'], parseColor(t['--brand'], t).rgb, t);
  }
  if (t['--destructive'] && t['--destructive-foreground']) {
    check('--destructive-foreground sur --destructive', t['--destructive-foreground'], parseColor(t['--destructive'], t).rgb, t);
  }

  // --warning (issue commerciale) et --destructive (erreur applicative) ont
  // déjà été strictement identiques : un dossier annulé s'affichait dans la
  // teinte exacte d'un formulaire en erreur.
  if (t['--warning'] && t['--destructive']) {
    const w = parseColor(t['--warning'], t);
    const d = parseColor(t['--destructive'], t);
    if (w && d) {
      const sep = ratio(w.rgb, d.rgb);
      const ok = sep >= 1.2;
      if (!ok) failures++;
      console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${'--warning vs --destructive (séparation)'.padEnd(46)} ${sep.toFixed(2).padStart(6)}:1`);
    }
  }
}

console.log(failures ? `\n${failures} paire(s) en échec — WCAG AA exige ${AA}:1\n` : '\nToutes les paires passent WCAG AA.\n');
process.exit(failures ? 1 : 0);
