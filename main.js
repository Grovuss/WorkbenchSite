// Points every download button at the newest installer, and plays the crash explanation in the hero.

const REPO = 'Grovuss/Workbench';

async function linkLatestRelease() {
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
      headers: { Accept: 'application/vnd.github+json' },
    });
    if (!res.ok) return;
    const release = await res.json();
    const installer = release.assets.find((a) => /setup.*\.exe$/i.test(a.name));
    if (!installer) return;
    const version = release.tag_name.replace(/^v/, '');
    const size = `${Math.round(installer.size / 1048576)} MB`;
    document.querySelectorAll('[data-download]').forEach((a) => (a.href = installer.browser_download_url));
    document.querySelectorAll('[data-version]').forEach((el) => (el.textContent = `Version ${version}`));
    document.querySelectorAll('[data-size]').forEach((el) => (el.textContent = ` · ${size}`));
  } catch {
    // The buttons already point at the releases page.
  }
}

const stage = document.querySelector('[data-stage]');
const svg = document.querySelector('[data-leaders]');
const NS = 'http://www.w3.org/2000/svg';
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

const pairs = [...stage.querySelectorAll('[data-problem]')].map((item) => ({
  item,
  line: stage.querySelector(`[data-culprit="${item.dataset.problem}"]`),
}));

/** Curves from each culprit log line to its explanation; yellow over the log, charcoal over the yellow field. */
function drawLeaders(animate) {
  svg.replaceChildren();
  if (getComputedStyle(svg).display === 'none') return;
  const box = stage.getBoundingClientRect();
  const seam = stage.querySelector('.log').getBoundingClientRect().right - box.left;

  const defs = document.createElementNS(NS, 'defs');
  const grad = document.createElementNS(NS, 'linearGradient');
  grad.id = 'leader-ink';
  grad.setAttribute('gradientUnits', 'userSpaceOnUse');
  grad.setAttribute('x1', seam - 1);
  grad.setAttribute('x2', seam + 1);
  grad.innerHTML = '<stop offset="0" stop-color="#fec424"/><stop offset="1" stop-color="#2a2a2b"/>';
  defs.append(grad);
  svg.append(defs);

  for (const { item, line } of pairs) {
    const l = line.getBoundingClientRect();
    const p = item.querySelector('p').getBoundingClientRect();
    const x1 = seam - 14;
    const y1 = l.top - box.top + l.height / 2;
    const x2 = p.left - box.left - 12;
    const y2 = p.top - box.top + 10;
    const mid = (x1 + x2) / 2;
    const path = document.createElementNS(NS, 'path');
    path.setAttribute('d', `M${x1},${y1} C${mid},${y1} ${mid},${y2} ${x2},${y2}`);
    path.setAttribute('stroke', 'url(#leader-ink)');
    const start = document.createElementNS(NS, 'circle');
    start.setAttribute('cx', x1);
    start.setAttribute('cy', y1);
    start.setAttribute('r', 3.5);
    start.setAttribute('fill', '#fec424');
    const end = document.createElementNS(NS, 'circle');
    end.setAttribute('cx', x2);
    end.setAttribute('cy', y2);
    end.setAttribute('r', 3.5);
    end.setAttribute('fill', '#2a2a2b');
    svg.append(path, start, end);
    if (animate) {
      const length = path.getTotalLength();
      path.style.strokeDasharray = length;
      path.style.strokeDashoffset = length;
      path.getBoundingClientRect();
      path.style.strokeDashoffset = 0;
    }
  }
}

function play() {
  stage.querySelectorAll('.ln').forEach((ln, i) => ln.style.setProperty('--i', i));
  stage.querySelectorAll('.problems li').forEach((li, i) => li.style.setProperty('--i', i));
  if (reduceMotion) {
    stage.classList.add('is-lit');
    drawLeaders(false);
    return;
  }
  stage.classList.add('is-playing');
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      stage.classList.add('is-run');
      setTimeout(() => stage.classList.add('is-lit'), 750);
      setTimeout(() => drawLeaders(true), 1000);
    }),
  );
}

// Hovering or focusing an explanation lights the log line it came from.
for (const { item, line } of pairs) {
  const on = () => line.classList.add('is-hot');
  const off = () => line.classList.remove('is-hot');
  item.addEventListener('pointerenter', on);
  item.addEventListener('pointerleave', off);
  item.addEventListener('focusin', on);
  item.addEventListener('focusout', off);

  const fix = item.querySelector('.fix');
  fix.addEventListener('click', () => {
    if (fix.classList.contains('is-done')) return;
    fix.classList.add('is-done');
    fix.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#i-check"/></svg> Installed';
    line.classList.add('is-fixed');
  });
}

let resizeTimer;
addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => stage.classList.contains('is-lit') && drawLeaders(false), 120);
});

document.fonts.ready.then(play);
linkLatestRelease();
