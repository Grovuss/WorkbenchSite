// Points every download button at the newest release, for the visitor's computer.

const REPO = 'Grovuss/Workbench';

// Each download, how to spot its file in a release, and what to say about it.
const BUILDS = {
  windows: { label: 'Windows', link: 'Windows', match: /setup.*\.exe$/i, note: 'Windows 10 and 11' },
  'mac-arm64': { label: 'Mac', link: 'Mac (Apple Silicon)', match: /-arm64\.dmg$/i, note: 'Apple Silicon Macs' },
  'mac-x64': { label: 'Mac', link: 'Mac (Intel)', match: /-x64\.dmg$/i, note: 'Intel Macs' },
  linux: { label: 'Linux', link: 'Linux', match: /\.AppImage$/i, note: 'Linux (AppImage)' },
};

/** Which build suits this computer. Safari can't tell Apple Silicon from Intel, so Macs get Apple Silicon unless the browser says otherwise. */
async function detectBuild() {
  const platform = (navigator.userAgentData?.platform || navigator.platform || navigator.userAgent).toLowerCase();
  if (platform.includes('win')) return 'windows';
  if (platform.includes('mac')) {
    try {
      const { architecture } = (await navigator.userAgentData?.getHighEntropyValues(['architecture'])) ?? {};
      if (architecture === 'x86') return 'mac-x64';
    } catch {
      // Not available: assume Apple Silicon.
    }
    return 'mac-arm64';
  }
  if (platform.includes('linux') && !/android/i.test(navigator.userAgent)) return 'linux';
  return 'windows';
}

async function linkLatestRelease() {
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
      headers: { Accept: 'application/vnd.github+json' },
    });
    if (!res.ok) return;
    const release = await res.json();
    const assets = Object.fromEntries(Object.entries(BUILDS).map(([id, b]) => [id, release.assets.find((a) => b.match.test(a.name))]));
    // A release without a build for this computer offers the Windows one, as before.
    let id = await detectBuild();
    if (!assets[id]) id = 'windows';
    const asset = assets[id];
    if (!asset) return;

    const build = BUILDS[id];
    const version = release.tag_name.replace(/^v/, '');
    document.querySelectorAll('[data-download]').forEach((a) => (a.href = asset.browser_download_url));
    document.querySelectorAll('[data-download-label]').forEach((el) => (el.textContent = `Download for ${build.label}`));
    document.querySelectorAll('[data-platform]').forEach((el) => (el.textContent = build.note));
    document.querySelectorAll('[data-version]').forEach((el) => (el.textContent = `Version ${version}`));
    document.querySelectorAll('[data-size]').forEach((el) => (el.textContent = ` · ${Math.round(asset.size / 1048576)} MB`));

    // The other downloads, for anyone getting Workbench for a different computer.
    const others = Object.keys(BUILDS).filter((other) => other !== id && assets[other]);
    if (!others.length) return;
    document.querySelectorAll('[data-other-downloads]').forEach((el) => {
      const links = others.map((other) => Object.assign(document.createElement('a'), { href: assets[other].browser_download_url, textContent: BUILDS[other].link }));
      el.replaceChildren(document.createTextNode('Also for '), ...links.flatMap((a, i) => (i ? [document.createTextNode(' · '), a] : [a])));
      el.hidden = false;
    });
  } catch {
    // The buttons already point at the releases page.
  }
}

linkLatestRelease();

// How many people use Workbench; each copy counts itself once (it can be turned off in its settings).
async function showUsers() {
  try {
    const res = await fetch('https://workbench-support.grovuss.workers.dev/stats');
    if (!res.ok) return;
    const { users } = await res.json();
    if (!Number.isFinite(users) || users < 1) return;
    const count = users.toLocaleString('en-US');
    document.querySelectorAll('[data-users]').forEach((el) => {
      el.textContent = `Join ${count} ${users === 1 ? 'person' : 'people'} already using it.`;
      el.hidden = false;
    });
  } catch {
    // Stays hidden.
  }
}

showUsers();
