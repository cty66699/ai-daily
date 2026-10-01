// 抓取 AI 新闻 RSS，解析并过滤 AI 相关条目，输出 extracted.json
const fs = require('fs');
const path = require('path');

const SOURCES = [
  { id: 'ithome', url: 'https://www.ithome.com/rss/' },
  { id: 'leiphone', url: 'https://www.leiphone.com/feed' },
];

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

const AI_KW = /人工智能|大模型|大语言模型|LLM|OpenAI|ChatGPT|GPT|Claude|Anthropic|Gemini|DeepMind|英伟达|NVIDIA|算力|GPU|AI芯片|芯片|生成式|AIGC|多模态|智能体|Agent|人形机器人|机器人|自动驾驶|深度学习|机器学习|神经网络|推理|训练|微调|开源模型|智驾|具身智能|基础模型|参数|数据中心|智能眼镜|蒸馏|模型/i;

async function main(){
  const out = [];
  for(const src of SOURCES){
    try{
      const res = await fetch(src.url, { signal: AbortSignal.timeout(25000), headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ai-daily-fetcher/1.0)' } });
      if(!res.ok){ console.log('FETCH-FAIL', src.id, res.status); continue; }
      const xml = await res.text();
      let items = parseItems(xml, 'item');
      if(items.length === 0) items = parseItems(xml, 'entry');
      const ai = items.filter(it => AI_KW.test(it.title + ' ' + it.desc));
      console.log(src.id, '->', items.length, 'items,', ai.length, 'AI');
      for(const it of ai.slice(0, 40)){
        out.push({ source: src.id, title: it.title, link: it.link, desc: it.desc.slice(0,240), date: it.date });
      }
    }catch(e){
      console.log('FETCH-ERR', src.id, String(e.message||e));
    }
  }
  const dir = __dirname;
  fs.writeFileSync(path.join(dir, 'extracted.json'), JSON.stringify(out, null, 2), 'utf8');
  console.log('wrote extracted.json with', out.length, 'items');
}
main();
