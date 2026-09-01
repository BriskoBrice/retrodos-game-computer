const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

function read(path) { return fs.readFileSync(path, 'utf8'); }

test('home shell exposes required RD-8088 sections', () => {
  const html = read('index.html');
  for (const id of ['searchInput','genreFilters','yearFilter','recentRail','collectionGrid','gameList','playerView','libraryView']) {
    assert.match(html, new RegExp(`id=["']${id}["']`));
  }
  assert.match(html, /RetroDOS Game Computer/);
  assert.match(html, /RD-8088/);
});

test('production source never links to Archive details pages', () => {
  const source = [read('index.html'), read('assets/js/app.js'), read('assets/js/core.js')].join('\n');
  assert.equal(source.includes('archive.org/details/'), false);
});

test('CSS includes responsive and reduced motion support', () => {
  const css = read('assets/css/retrodos.css');
  assert.match(css, /@media\s*\(max-width:\s*700px\)/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /body::after/);
});

test('home control resets to the full library and DOS history keeps its backslash', () => {
  const app = read('assets/js/app.js');
  assert.match(app, /homeButton\.addEventListener\('click', \(\) => navigate\('library'\)\)/);
  assert.ok(app.includes('C:\\\\HISTORY&gt;'));
});
