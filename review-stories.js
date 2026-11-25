(() => {
  const panel = document.querySelector('[data-review-view]');
  const catalog = JSON.parse(document.getElementById('review-catalog').textContent);
  const heading = document.getElementById('review-stories');
  const navigation = document.getElementById('review-months');
  const lessons = document.getElementById('review-lessons');
  const archive = panel.dataset.reviewView === 'archive';
  const monthFormat = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const dayFormat = new Intl.DateTimeFormat('en', { month: 'long', day: '2-digit', timeZone: 'UTC' });
  const seoulFormat = new Intl.DateTimeFormat('en', { year: 'numeric', month: '2-digit', timeZone: 'Asia/Seoul' });
  const getCurrentMonth = () => {
    const parts = seoulFormat.formatToParts(new Date());
    return parts.find(part => part.type === 'year').value + '-' + parts.find(part => part.type === 'month').value;
  };

  const months = new Map();
  for (const filename of catalog) {
    if (!filename) continue;
    const match = /^(?:(\d{4})-)?(\d{1,2})[.-](\d{1,2}) Review (\d{3,4})\.html$/.exec(filename);
    if (!match) continue;
    const [, explicitYear, month, day, time] = match;
    // Existing reviews use M.D filenames. February–December belong to the
    // original 2026 archive, and January is the first month of the next cycle.
    const year = Number(explicitYear || (Number(month) === 1 ? 2027 : 2026));
    const date = new Date(Date.UTC(year, Number(month) - 1, Number(day)));
    if (date.getUTCMonth() + 1 !== Number(month) || date.getUTCDate() !== Number(day)) continue;
    const dateKey = date.toISOString().slice(0, 10);
    const monthKey = dateKey.slice(0, 7);
    if (!months.has(monthKey)) months.set(monthKey, new Map());
    const days = months.get(monthKey);
    if (!days.has(dateKey)) days.set(dateKey, []);
    days.get(dateKey).push({ filename, time: Number(time) });
  }

  function create(tag, text, className) {
    const element = document.createElement(tag);
    element.textContent = text;
    if (className) element.className = className;
    return element;
  }

  let renderedMonth;
  function render() {
    const currentMonth = getCurrentMonth();
    const renderKey=archive?currentMonth:new Date(Date.now()+9*3600000).toISOString().slice(0,10);
    if (renderedMonth === renderKey) return;
    renderedMonth = renderKey;
    const older = Array.from(months.keys()).filter(key => key <= currentMonth).sort().reverse();
    const requested = new URLSearchParams(location.search).get('month');
    const selected = archive ? (older.includes(requested) ? requested : older[0]) : currentMonth;
    const monthLabel = key => monthFormat.format(new Date(key + '-01T00:00:00Z'));

    if (archive && selected) {
      heading.textContent = '📚 ' + monthLabel(selected) + ' Reviews';
      document.title = monthLabel(selected) + ' Reviews · Reps';
    }

    const links = create('div', '', 'review-month-links');
    if (archive) {
      const home = create('a', 'Home', 'review-month-link');
      home.href = './index.html';
      links.append(home);
    }
    for (const key of older) {
      const link = create('a', monthLabel(key), 'review-month-link');
      link.href = './review-archive.html?month=' + key;
      if (key === selected) link.setAttribute('aria-current', 'page');
      links.append(link);
    }
    navigation.hidden = !links.childElementCount;
    navigation.replaceChildren(create('h3', 'Review Archive', 'review-archive-label'), links);

    const days = archive ? months.get(selected) : new Map(Array.from(months.values()).flatMap(m=>Array.from(m.entries())).filter(([key])=>key<=new Date(Date.now()+9*3600000).toISOString().slice(0,10)).sort((a,b)=>b[0].localeCompare(a[0])).slice(0,1));
    lessons.replaceChildren();
    
    if (!days || !days.size) {
      lessons.append(create('p', 'No reviews have been posted yet.', 'review-empty'));
      return;
    }
    for (const dateKey of Array.from(days.keys()).sort().reverse()) {
      const section = create('section', '', 'date-section');
      section.append(create(archive ? 'h3' : 'h4', dayFormat.format(new Date(dateKey + 'T00:00:00Z')), 'date-header'));
      for (const { filename, time } of days.get(dateKey).sort((a, b) => a.time - b.time)) {
        const hour = Math.floor(time / 100);
        const minute = String(time % 100).padStart(2, '0');
        const link = create('a', '⏰ ' + hour + ':' + minute + (hour === 12 ? ' PM' : ' AM') + ' Class', 'lesson-link');
        link.href = './' + encodeURIComponent(filename);
        section.append(link);
      }
      lessons.append(section);
    }
  }

  render();
  window.addEventListener('pageshow', render);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) render();
  });
})();
