// Points every download button at the newest installer.

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

linkLatestRelease();
