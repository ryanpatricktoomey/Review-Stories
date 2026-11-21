(() => {
  if (window.self !== window.top) return;

  const home = new URL('./index.html', document.currentScript.src);
  const appDirectory = new URL('.', home);
  const isAppPage = url => url.origin === home.origin
    && url.pathname.startsWith(appDirectory.pathname)
    && /^(?:index\.html|wordbank\.html|english-corner(?:-profile|-notifications)?\.html|review-archive\.html|(?:\d{4}-\d{2}-\d{2}|\d{1,2}\.\d{1,2})%20Review%20\d{3,4}\.html)?$/i
      .test(url.pathname.slice(appDirectory.pathname.length));

  const style = document.createElement('style');
  style.textContent = `
    button.reps-back {
      appearance: none;
      position: fixed;
      left: calc(14px + env(safe-area-inset-left, 0px));
      bottom: calc(14px + env(safe-area-inset-bottom, 0px));
      z-index: 40;
      box-sizing: border-box;
      width: 44px;
      height: 44px;
      margin: 0;
      padding: 0;
      display: grid;
      place-items: center;
      border: 1px solid rgba(148, 163, 184, .65);
      border-radius: 50%;
      background: rgba(15, 23, 42, .76);
      color: #f8fafc;
      box-shadow: 0 2px 10px rgba(0, 0, 0, .24);
      cursor: pointer;
      touch-action: manipulation;
    }
    button.reps-back::before {
      content: '';
      display: block;
      width: 10px;
      height: 10px;
      border-left: 2px solid currentColor;
      border-bottom: 2px solid currentColor;
      transform: translateX(2px) rotate(45deg);
    }
    button.reps-back:focus-visible {
      outline: 2px solid #7dd3fc;
      outline-offset: 3px;
    }
    button.reps-back:active { background: #0f172a; }
    .reps-back-spacing { display: block; height: calc(54px + env(safe-area-inset-bottom, 0px)); flex: none; }
    @media (pointer: coarse) {
      body:has(textarea:focus, input:not([type=checkbox],[type=radio],[type=button],[type=submit]):focus, [contenteditable=true]:focus) button.reps-back {
        visibility: hidden;
      }
    }
  `;
  document.head.append(style);

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'reps-back';
  button.setAttribute('aria-label', 'Back');
  const spacing = document.createElement('div');
  spacing.className = 'reps-back-spacing';
  spacing.setAttribute('aria-hidden', 'true');
  document.body.append(spacing, button);

  button.addEventListener('click', () => {
    const nav = window.navigation;
    if (nav && nav.currentEntry) {
      const previous = nav.entries().find(entry => entry.index === nav.currentEntry.index - 1);
      if (previous?.url && isAppPage(new URL(previous.url))) {
        history.back();
        return;
      }
    } else if (history.length > 1 && document.referrer && isAppPage(new URL(document.referrer))) {
      history.back();
      return;
    }

    // A review opened directly from a shared link still has a way home.
    location.replace(home.href);
  });
})();
