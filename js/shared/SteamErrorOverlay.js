(function installTopoboardgameSteamErrorOverlay() {
  if (typeof window === 'undefined' || window.__TBG_STEAM_ERROR_OVERLAY__) return;
  window.__TBG_STEAM_ERROR_OVERLAY__ = true;

  function isDesktopRuntime() {
    return Boolean(window.TopoboardgameLocalApp?.isDesktop);
  }

  function isDebugRuntime() {
    const params = new URLSearchParams(window.location.search || '');
    const stored = (() => {
      try { return window.localStorage.getItem('topoboardgame:debug-errors') === '1'; } catch { return false; }
    })();
    return params.get('debugErrors') === '1'
      || stored
      || window.location.hostname === '127.0.0.1'
      || window.location.hostname === 'localhost';
  }

  if (!isDesktopRuntime() && !isDebugRuntime()) return;

  function currentLang() {
    const htmlLang = document.documentElement?.lang || '';
    let stored = '';
    try { stored = window.localStorage.getItem('topoboardgame:language') || ''; } catch {}
    return /^zh/i.test(stored || htmlLang) ? 'zh' : 'en';
  }

  const text = {
    en: {
      title: 'An error occurred while loading this game.',
      menu: 'Return to Main Menu',
      reload: 'Reload',
      copy: 'Copy Error',
      copied: 'Copied',
      url: 'Current URL',
      edition: 'Edition',
      version: 'Version'
    },
    zh: {
      title: '載入此遊戲時發生錯誤。',
      menu: '返回主選單',
      reload: '重新載入',
      copy: '複製錯誤',
      copied: '已複製',
      url: '目前網址',
      edition: '版本類型',
      version: '版本'
    }
  };

  function formatError(error) {
    const reason = error?.reason || error?.error || error;
    const message = reason?.message || String(reason || 'Unknown error');
    const stack = reason?.stack || error?.message || '';
    const version = window.__TBG_VERSION__ || {};
    return {
      message,
      stack: String(stack).split(/\r?\n/).slice(0, 12).join('\n'),
      url: window.location.href,
      edition: version.edition || window.__TBG_EDITION__ || 'unknown',
      version: version.version || 'unknown'
    };
  }

  function showOverlay(error) {
    const lang = currentLang();
    const strings = text[lang] || text.en;
    const details = formatError(error);
    console.error('[Topoboardgame runtime error]', error);

    let overlay = document.getElementById('tbg-steam-error-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'tbg-steam-error-overlay';
      overlay.innerHTML = `
        <div class="tbg-steam-error-card" role="alertdialog" aria-live="assertive">
          <h1></h1>
          <div class="tbg-steam-error-actions">
            <button type="button" data-action="menu"></button>
            <button type="button" data-action="reload"></button>
            <button type="button" data-action="copy"></button>
          </div>
          <dl>
            <dt data-label="message">Message</dt>
            <dd data-field="message"></dd>
            <dt data-label="url"></dt>
            <dd data-field="url"></dd>
            <dt data-label="edition"></dt>
            <dd data-field="edition"></dd>
            <dt data-label="version"></dt>
            <dd data-field="version"></dd>
          </dl>
          <pre data-field="stack"></pre>
        </div>`;
      const style = document.createElement('style');
      style.textContent = `
        #tbg-steam-error-overlay {
          position: fixed;
          inset: 0;
          z-index: 2147483647;
          display: grid;
          place-items: center;
          padding: 24px;
          background: rgba(2, 8, 18, 0.92);
          color: #eef6ff;
          font: 15px/1.45 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }
        #tbg-steam-error-overlay .tbg-steam-error-card {
          width: min(900px, 100%);
          max-height: min(760px, 92vh);
          overflow: auto;
          border: 1px solid #4a6f9d;
          border-radius: 14px;
          background: #0d1726;
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.45);
          padding: 24px;
        }
        #tbg-steam-error-overlay h1 {
          margin: 0 0 16px;
          color: #ffd761;
          font-size: clamp(22px, 3vw, 34px);
        }
        #tbg-steam-error-overlay button {
          min-height: 42px;
          border: 1px solid #4f86c6;
          border-radius: 10px;
          background: #101f34;
          color: #eef6ff;
          padding: 8px 14px;
          font: inherit;
          font-weight: 700;
          cursor: pointer;
        }
        #tbg-steam-error-overlay .tbg-steam-error-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 18px;
        }
        #tbg-steam-error-overlay dl {
          display: grid;
          grid-template-columns: max-content minmax(0, 1fr);
          gap: 8px 14px;
          margin: 0 0 16px;
        }
        #tbg-steam-error-overlay dt {
          color: #9cc7f5;
          font-weight: 700;
        }
        #tbg-steam-error-overlay dd {
          margin: 0;
          overflow-wrap: anywhere;
        }
        #tbg-steam-error-overlay pre {
          white-space: pre-wrap;
          overflow-wrap: anywhere;
          margin: 0;
          padding: 14px;
          border-radius: 10px;
          background: #050a12;
          color: #ffb4b4;
        }
      `;
      document.head.appendChild(style);
      document.body.appendChild(overlay);

      overlay.querySelector('[data-action="menu"]').addEventListener('click', () => {
        window.location.href = '/';
      });
      overlay.querySelector('[data-action="reload"]').addEventListener('click', () => window.location.reload());
      overlay.querySelector('[data-action="copy"]').addEventListener('click', async (event) => {
        const payload = overlay.__errorPayload || '';
        try {
          await navigator.clipboard.writeText(payload);
          event.currentTarget.textContent = strings.copied;
        } catch {
          const area = document.createElement('textarea');
          area.value = payload;
          document.body.appendChild(area);
          area.select();
          try { document.execCommand('copy'); } catch {}
          area.remove();
          event.currentTarget.textContent = strings.copied;
        }
      });
    }

    overlay.querySelector('h1').textContent = strings.title;
    overlay.querySelector('[data-action="menu"]').textContent = strings.menu;
    overlay.querySelector('[data-action="reload"]').textContent = strings.reload;
    overlay.querySelector('[data-action="copy"]').textContent = strings.copy;
    overlay.querySelector('[data-label="url"]').textContent = strings.url;
    overlay.querySelector('[data-label="edition"]').textContent = strings.edition;
    overlay.querySelector('[data-label="version"]').textContent = strings.version;
    overlay.querySelector('[data-field="message"]').textContent = details.message;
    overlay.querySelector('[data-field="url"]').textContent = details.url;
    overlay.querySelector('[data-field="edition"]').textContent = details.edition;
    overlay.querySelector('[data-field="version"]').textContent = details.version;
    overlay.querySelector('[data-field="stack"]').textContent = details.stack || details.message;
    overlay.__errorPayload = [
      strings.title,
      `Message: ${details.message}`,
      `${strings.url}: ${details.url}`,
      `${strings.edition}: ${details.edition}`,
      `${strings.version}: ${details.version}`,
      details.stack
    ].filter(Boolean).join('\n');
  }

  window.addEventListener('error', showOverlay);
  window.addEventListener('unhandledrejection', showOverlay);
})();
