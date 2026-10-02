/* AI 每日精选 —— 左侧「往期归档」侧栏（近 15 天）
 * 数据来自 archive.js 的 window.ARCHIVE_DATES（最新在前）。
 * 在 </body> 前同步执行：把 .wrap 的原有内容移入 .main，并在左侧注入 .sidebar。 */
(function () {
  var DATES = (window.ARCHIVE_DATES || []).slice(0, 15);
  var wrap = document.querySelector('.wrap');
  if (!wrap || wrap.querySelector('.sidebar')) return;

  var inArchive = /\/archive\//.test(location.pathname);
  var base = inArchive ? '../' : '';        // 回首页/引用根文件用
  var prefix = inArchive ? '' : 'archive/'; // 链接到归档页用
  var cur = location.pathname.split('/').pop();
  var atHome = (!inArchive && (cur === '' || cur === 'index.html' || cur === undefined));

  var sb = document.createElement('aside');
  sb.className = 'sidebar';

  var title = document.createElement('div');
  title.className = 'sb-title';
  title.textContent = '往期归档 · 近15天';
  sb.appendChild(title);

  var home = document.createElement('a');
  home.className = 'sb-home' + (atHome ? ' active' : '');
  home.href = base + 'index.html';
  home.textContent = '← 回到今日（首页）';
  sb.appendChild(home);

  var ul = document.createElement('ul');

  if (!DATES.length) {
    var li0 = document.createElement('li');
    li0.className = 'sb-empty';
    li0.textContent = '暂无归档';
    ul.appendChild(li0);
  }

  DATES.forEach(function (d, i) {
    var li = document.createElement('li');
    var a = document.createElement('a');
    a.href = prefix + d + '.html';

    var isNewest = (i === 0);
    if (cur === d + '.html' || (atHome && isNewest)) a.className = 'active';

    var label = document.createElement('span');
    label.textContent = d;
    a.appendChild(label);

    if (isNewest) {
      var b = document.createElement('span');
      b.className = 'badge';
      b.textContent = '最新';
      a.appendChild(b);
    }

    li.appendChild(a);
    ul.appendChild(li);
  });

  sb.appendChild(ul);

  // 重排布局：原有内容 -> .main，侧栏置于最左
  var main = document.createElement('main');
  main.className = 'main';
  while (wrap.firstChild) main.appendChild(wrap.firstChild);
  wrap.appendChild(sb);
  wrap.appendChild(main);
})();
