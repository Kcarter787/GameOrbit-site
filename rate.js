'use strict';
// The homepage rating demo. Same rubric as the app (CategoryRatings.scoreTenths): Fun picks a range
// in tenths, and Gameplay, Art and sound, and Story each place the game (stars - 1) / 12 of the way
// through it. Integer arithmetic, halves round up.
(() => {
  const form = document.getElementById('rater');
  if (!form) return;
  const ranges = [[0, 39], [40, 54], [55, 69], [70, 84], [85, 100]];
  const levels = {
    fun: ['Didn’t enjoy it', 'Had its moments', 'Enjoyed it', 'Loved playing it', 'Couldn’t put it down'],
    gameplay: ['Frustrating or shallow', 'Rough edges', 'Solid', 'Excellent', 'Masterful'],
    art: ['Detracted from it', 'Forgettable', 'Pleasant', 'Striking', 'Iconic'],
    story: ['Weak or missing', 'Forgettable', 'Engaging', 'Gripping', 'Unforgettable'],
  };
  const words = ['One star', 'Two stars', 'Three stars', 'Four stars', 'Five stars'];
  const score = document.getElementById('score');
  const summary = document.getElementById('summary');
  const segments = form.querySelectorAll('.segments span');
  const [gameplayFill, artFill, storyFill] = form.querySelectorAll('.track i');
  const marker = form.querySelector('.track b');
  const low = document.getElementById('low');
  const high = document.getElementById('high');
  const still = window.matchMedia('(prefers-reduced-motion: reduce)');
  const value = name => Number(form.querySelector(`input[name="${name}"]:checked`).value);
  const decimal = tenths => (tenths / 10).toFixed(1);
  const endpoint = tenths => (tenths === 0 || tenths === 100 ? String(tenths / 10) : decimal(tenths));

  function update(announce) {
    const stars = {fun: value('fun'), gameplay: value('gameplay'), art: value('art'), story: value('story')};
    for (const [name, count] of Object.entries(stars)) {
      form.querySelectorAll(`input[name="${name}"] + label`).forEach((label, index) => {
        label.classList.toggle('on', index < count);
      });
      form.querySelector(`[data-level="${name}"]`).textContent = levels[name][count - 1];
    }
    const [from, to] = ranges[stars.fun - 1];
    const other = stars.gameplay + stars.art + stars.story - 3;
    const tenths = from + Math.floor((other * (to - from) + 6) / 12);
    const tier = tenths >= 85 ? 5 : tenths >= 70 ? 4 : tenths >= 55 ? 3 : tenths >= 40 ? 2 : 1;
    const previous = score.textContent;
    score.textContent = decimal(tenths);
    score.className = `score t${tier}`;
    if (announce && previous !== score.textContent && !still.matches) {
      void score.offsetWidth;
      score.classList.add('pop');
    }
    segments.forEach((segment, index) => segment.classList.toggle('on', index === stars.fun - 1));
    const share = count => `${((count - 1) / 12) * 100}%`;
    gameplayFill.style.width = share(stars.gameplay);
    artFill.style.width = share(stars.art);
    storyFill.style.width = share(stars.story);
    marker.style.left = `${(other / 12) * 100}%`;
    low.textContent = endpoint(from);
    high.textContent = endpoint(to);
    if (announce) {
      summary.textContent = `Score ${decimal(tenths)}. ${words[stars.fun - 1]} for Fun sets the range from ${endpoint(from)} to ${endpoint(to)}.`;
    }
  }

  form.addEventListener('change', () => update(true));
  form.addEventListener('submit', event => event.preventDefault());
  update(false);
})();
