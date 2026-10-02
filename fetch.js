// 抓取 AI 新闻 RSS（中文源直连 + 国际源走本地 Clash 代理），过滤 AI 条目，
// 并为候选项抓取「配图」（本地下载 + 压缩到宽 800）与「网友评论」（Hacker News），输出 extracted.json。
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROXY = 'http://127.0.0.1:7890';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

const SOURCES = [
  { id: 'ithome', url: 'https://www.ithome.com/rss/', proxy: false },
  { id: 'leiphone', url: 'https://www.leiphone.com/feed', proxy: false },
  { id: 'openai', url: 'https://openai.com/news/rss.xml', proxy: true },
  { id: 'hn', url: 'https://hnrss.org/frontpage', proxy: true },
  { id: 'arstechnica', url: 'https://arstechnica.com/ai/feed/', proxy: true },
  { id: 'techcrunch', url: 'https://techcrunch.com/category/artificial-intelligence/feed/', proxy: true },
  { id: 'googleai', url: 'https://blog.google/technology/ai/rss/', proxy: true },
];
const INTL = new Set(['openai', 'hn', 'arstechnica', 'techcrunch', 'googleai']);

// 当天日期（Asia/Shanghai）
const TODAY = (function () {
  return new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10);
})();
const IMG_DIR = path.join(__dirname, 'images', TODAY);
const TMP_DIR = path.join(__dirname, '.tmpimg');
const MAX_IMG = 24;      // 每天最多下载多少张配图
const MAX_COMMENTS = 5;  // 每条最多摘几条网友评论

function fetchViaCurl(url, useProxy, outFile) {
  const args = ['-s', '--max-time', '30', '-L', '-A', UA];
  if (useProxy) args.push('-x', PROXY);
  if (outFile) args.push('-o', outFile);
  args.push(url);
  return execFileSync('curl.exe', args, { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
}

function stripTags(s) {
  return String(s || '').replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/&#x([0-9a-fA-F]+);/g, (m, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (m, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/\s+/g, ' ').trim();
}
function decode(s) { return String(s || '').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1'); }

function parseItems(xml, tag) {
  const items = [];
  const re = new RegExp('<' + tag + '[^>]*>([\\s\\S]*?)</' + tag + '>', 'g');
  let m;
  while ((m = re.exec(xml)) !== null) {
    const block = m[1];
    const g = (t) => {
      const r = new RegExp('<' + t + '[^>]*>([\\s\\S]*?)</' + t + '>', 'i');
      const mm = block.match(r);
      return mm ? decode(mm[1]) : '';
    };
    items.push({
      title: stripTags(g('title')),
      link: stripTags(g('link')),
      rawDesc: g('description') || g('summary') || g('content'),
      desc: stripTags(g('description') || g('summary') || g('content')),
      date: stripTags(g('pubDate') || g('published') || g('updated')),
    });
  }
  return items;
}

// 从 RSS 描述的 HTML 里抓第一张图
function imgFromDesc(html) {
  const m = String(html || '').match(/<img[^>]+src=["']([^"']+)["']/i);
  return m ? m[1] : '';
}
// 从文章页里抓 og:image / 第一张正文图
function imgFromPage(html) {
  let m = String(html || '').match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
    || String(html || '').match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
  if (m) return m[1];
  m = String(html || '').match(/<img[^>]+(?:data-original|data-src|src)=["']([^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/i);
  return m ? m[1] : '';
}
function absUrl(u) {
  u = String(u || '').trim();
  if (u.startsWith('//')) return 'https:' + u;
  if (u.startsWith('/')) return 'https:' + u; // 仅兜底，极少见
  return u;
}

// 一次性调用 PowerShell（System.Drawing）批量压缩到宽 800、JPEG q78
function resizeAll(pairs) {
  if (!pairs.length) return;
  const body = pairs.map(([s, d]) =>
    'resize ' + "'" + s.replace(/'/g, "''") + "' '" + d.replace(/'/g, "''") + "'").join('; ');
  const ps = [
    'Add-Type -AssemblyName System.Drawing',
    'function resize($src,$dst){',
    '  $img=[System.Drawing.Image]::FromFile($src)',
    '  $scale=[Math]::Min(1.0, 800.0/$img.Width)',
    '  $nw=[int]($img.Width*$scale); $nh=[int]($img.Height*$scale)',
    '  $bmp=New-Object System.Drawing.Bitmap $nw,$nh',
    '  $g=[System.Drawing.Graphics]::FromImage($bmp)',
    '  $g.InterpolationMode=[System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic',
    '  $g.DrawImage($img,0,0,$nw,$nh)',
    '  $enc=[System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders()|Where-Object{$_.MimeType -eq "image/jpeg"}',
    '  $ep=New-Object System.Drawing.Imaging.EncoderParameters 1',
    '  $ep.Param[0]=New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality,[long]78)',
    '  $bmp.Save($dst,$enc,$ep)',
    '  $img.Dispose();$bmp.Dispose();$g.Dispose()',
    '}',
    body,
  ].join('\n');
  execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', ps], { encoding: 'utf8', stdio: 'pipe' });
}

// Hacker News：按 URL 找讨论帖，取少量高赞评论
function hnComments(link) {
  try {
    const q = encodeURIComponent(link);
    const r = fetchViaCurl('https://hn.algolia.com/api/v1/search?query=' + q +
      '&restrictSearchableAttributes=url&tags=story&hitsPerPage=1', true);
    const o = JSON.parse(r);
    if (!o.nbHits || !o.hits[0] || !o.hits[0].num_comments) return null;
    const hit = o.hits[0];
    const t = fetchViaCurl('https://hn.algolia.com/api/v1/items/' + hit.objectID, true);
    const tree = JSON.parse(t);
    const picked = [];
    (function walk(node, depth) {
      if (!node || picked.length >= MAX_COMMENTS) return;
      for (const c of (node.children || [])) {
        if (picked.length >= MAX_COMMENTS) break;
        if (c.text && depth <= 1) {
          const txt = stripTags(c.text);
          if (txt.length >= 12) picked.push({ by: c.author, text: txt.slice(0, 220) });
        }
        if (depth < 1) walk(c, depth + 1);
      }
    })(tree, 0);
    if (!picked.length) return null;
    return {
      points: hit.points,
      num_comments: hit.num_comments,
      url: 'https://news.ycombinator.com/item?id=' + hit.objectID,
      top: picked,
    };
  } catch (e) { return null; }
}

const AI_KW = /artificial intelligence|\bAI\b|人工智能|大模型|大语言模型|\bLLM|OpenAI|ChatGPT|GPT|Claude|Anthropic|Gemini|DeepMind|英伟达|NVIDIA|Nvidia|算力|GPU|AI芯片|芯片|生成式|generative|AIGC|多模态|multimodal|智能体|Agent|人形机器人|机器人|robot|自动驾驶|autonomous|深度学习|机器学习|machine learning|神经网络|neural|推理|inference|训练|training|微调|fine-tun|开源模型|智驾|具身智能|基础模型|foundation model|参数|数据中心|data center|智能眼镜|smart glasses|蒸馏|distill|模型|model|权重|benchmark/i;

async function main() {
  const out = [];
  for (const src of SOURCES) {
    try {
      const xml = fetchViaCurl(src.url, src.proxy);
      let items = parseItems(xml, 'item');
      if (items.length === 0) items = parseItems(xml, 'entry');
      let ai = items.filter(it => AI_KW.test(it.title + ' ' + it.desc));
      if (ai.length === 0 && ['openai', 'arstechnica', 'techcrunch', 'googleai'].includes(src.id)) {
        ai = items.slice(0, 15).map(it => ({ ...it }));
      }
      console.log(src.id, '->', items.length, 'items,', ai.length, 'AI');
      for (const it of ai.slice(0, 40)) {
        out.push({
          source: src.id, title: it.title, link: it.link, desc: it.desc.slice(0, 240),
          date: it.date, imgsrc: absUrl(imgFromDesc(it.rawDesc)),
        });
      }
    } catch (e) {
      console.log('FETCH-ERR', src.id, String(e.message || e).slice(0, 120));
    }
  }

  // 去重（按标题）
  const seen = new Set();
  const dedup = [];
  for (const it of out) {
    const k = it.title.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k); dedup.push(it);
  }

  // 选候选项：每个源取最新的 5 条，再按时间倒序，最多 30 条
  const bySrc = {};
  for (const it of dedup) { (bySrc[it.source] = bySrc[it.source] || []).push(it); }
  const cands = [];
  for (const sid of Object.keys(bySrc)) {
    bySrc[sid].sort((a, b) => (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0));
    cands.push(...bySrc[sid].slice(0, 5));
  }
  cands.sort((a, b) => (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0));
  const pick = cands.slice(0, 30);

  // 配图：补 page og:image，下载并压缩
  fs.rmSync(IMG_DIR, { recursive: true, force: true });
  fs.mkdirSync(IMG_DIR, { recursive: true });
  fs.mkdirSync(TMP_DIR, { recursive: true });
  const pairs = [];
  let nImg = 0;
  for (const it of pick) {
    if (nImg >= MAX_IMG) break;
    try {
      if (!it.imgsrc && it.link.startsWith('http')) {
        const page = fetchViaCurl(it.link, INTL.has(it.source));
        it.imgsrc = absUrl(imgFromPage(page));
      }
      if (!it.imgsrc || !/^https?:\/\//.test(it.imgsrc)) continue;
      const name = String(nImg).padStart(3, '0') + '.jpg';
      const tmp = path.join(TMP_DIR, 's' + nImg + '.bin');
      fetchViaCurl(it.imgsrc, INTL.has(it.source) || /techcrunch|arstechnica|openai|google|cdn\.|wp-content/.test(it.imgsrc), tmp);
      const dst = path.join(IMG_DIR, name);
      pairs.push([tmp, dst]);
      it.img = 'images/' + TODAY + '/' + name;
      nImg++;
    } catch (e) { console.log('IMG-ERR', it.source, String(e.message || e).slice(0, 80)); }
  }
  if (pairs.length) {
    try { resizeAll(pairs); } catch (e) { console.log('RESIZE-ERR', String(e.message || e).slice(0, 120)); }
  }

  // 网友评论（HN）
  let nCmt = 0;
  for (const it of pick) {
    if (!it.link.startsWith('http')) continue;
    const c = hnComments(it.link);
    if (c) { it.comments = c; nCmt++; }
  }

  fs.writeFileSync(path.join(__dirname, 'extracted.json'), JSON.stringify(dedup, null, 2), 'utf8');
  console.log('wrote extracted.json with', dedup.length, 'items;', nImg, 'images;', nCmt, 'with comments');
  try { fs.rmSync(TMP_DIR, { recursive: true, force: true }); } catch (e) {}
}
main();
