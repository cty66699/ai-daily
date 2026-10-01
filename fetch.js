// 抓取 AI 新闻 RSS（中文源直连 + 国际源走本地 Clash 代理），过滤 AI 条目，输出 extracted.json
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROXY = 'http://127.0.0.1:7890';

const SOURCES = [
  { id: 'ithome', url: 'https://www.ithome.com/rss/', proxy: false },
  { id: 'leiphone', url: 'https://www.leiphone.com/feed', proxy: false },
  { id: 'openai', url: 'https://openai.com/news/rss.xml', proxy: true },
  { id: 'hn', url: 'https://hnrss.org/frontpage', proxy: true },
  { id: 'arstechnica', url: 'https://arstechnica.com/ai/feed/', proxy: true },
  { id: 'techcrunch', url: 'https://techcrunch.com/category/artificial-intelligence/feed/', proxy: true },
  { id: 'googleai', url: 'https://blog.google/technology/ai/rss/', proxy: true },
];

function fetchViaCurl(url, useProxy){
  const args = ['-s', '--max-time', '30', '-L', '-A', 'Mozilla/5.0 (compatible; ai-daily-fetcher/1.0)'];
  if(useProxy) args.push('-x', PROXY);
  args.push(url);
  return execFileSync('curl.exe', args, { encoding: 'utf8', maxBuffer: 12 * 1024 * 1024 });
}

function stripTags(s){ return String(s||'').replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&nbsp;/g,' ').replace(/&#x([0-9a-fA-F]+);/g,(m,h)=>String.fromCodePoint(parseInt(h,16))).replace(/&#(\d+);/g,(m,d)=>String.fromCodePoint(parseInt(d,10))).replace(/\s+/g,' ').trim(); }
function decode(s){ return String(s||'').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1'); }

function parseItems(xml, tag){
  const items = [];
  const re = new RegExp('<'+tag+'[^>]*>([\\s\\S]*?)</'+tag+'>','g');
  let m;
  while((m = re.exec(xml)) !== null){
    const block = m[1];
    const g = (t) => {
      const r = new RegExp('<'+t+'[^>]*>([\\s\\S]*?)</'+t+'>','i');
      const mm = block.match(r);
      return mm ? decode(mm[1]) : '';
    };
    items.push({
      title: stripTags(g('title')),
      link: stripTags(g('link')),
      desc: stripTags(g('description') || g('summary') || g('content')),
      date: stripTags(g('pubDate') || g('published') || g('updated')),
    });
  }
  return items;
}

const AI_KW = /artificial intelligence|\bAI\b|人工智能|大模型|大语言模型|\bLLM|OpenAI|ChatGPT|GPT|Claude|Anthropic|Gemini|DeepMind|英伟达|NVIDIA|Nvidia|算力|GPU|AI芯片|芯片|生成式|generative|AIGC|多模态|multimodal|智能体|Agent|人形机器人|机器人|robot|自动驾驶|autonomous|深度学习|机器学习|machine learning|神经网络|neural|推理|inference|训练|training|微调|fine-tun|开源模型|智驾|具身智能|基础模型|foundation model|参数|数据中心|data center|智能眼镜|smart glasses|蒸馏|distill|模型|model|权重|benchmark/i;

async function main(){
  const out = [];
  for(const src of SOURCES){
    try{
      const xml = fetchViaCurl(src.url, src.proxy);
      let items = parseItems(xml, 'item');
      if(items.length === 0) items = parseItems(xml, 'entry');
      let ai = items.filter(it => AI_KW.test(it.title + ' ' + it.desc));
      // 国际源本身已聚焦 AI，若关键词命中太少则退化为按时间取前若干
      if(ai.length === 0 && ['openai','arstechnica','techcrunch','googleai'].includes(src.id)){
        ai = items.slice(0, 15).map(it => ({ ...it }));
      }
      console.log(src.id, '->', items.length, 'items,', ai.length, 'AI');
      for(const it of ai.slice(0, 40)){
        out.push({ source: src.id, title: it.title, link: it.link, desc: it.desc.slice(0,240), date: it.date });
      }
    }catch(e){
      console.log('FETCH-ERR', src.id, String(e.message||e).slice(0,120));
    }
  }
  fs.writeFileSync(path.join(__dirname, 'extracted.json'), JSON.stringify(out, null, 2), 'utf8');
  console.log('wrote extracted.json with', out.length, 'items');
}
main();
