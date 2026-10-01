const fs = require('fs');
const dir = 'D:/DeepSeekharness/_sandbox_openclaw/home-es/workspace/ai-daily/feeds';

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

const AI_KW = /人工智能|大模型|大语言模型|LLM|OpenAI|ChatGPT|GPT|Claude|Anthropic|Gemini|DeepMind|英伟达|NVIDIA|算力|GPU|AI芯片|芯片|生成式|AIGC|多模态|智能体|Agent|人形机器人|机器人|自动驾驶|深度学习|机器学习|神经网络|推理|训练|微调|开源模型|智驾|具身智能|基础模型|参数|数据中心|智能眼镜|蒸馏/i;

const out = [];
for (const file of ['ithome.xml','36kr.xml','solidot.xml']){
  const p = dir + '/' + file;
  if(!fs.existsSync(p)) continue;
  const xml = fs.readFileSync(p,'utf8');
  let items = parseItems(xml, 'item');
  if(items.length === 0) items = parseItems(xml, 'entry'); // atom
  const ai = items.filter(it => AI_KW.test(it.title + ' ' + it.desc));
  for(const it of ai.slice(0, 30)){
    out.push({ source: file.replace('.xml',''), title: it.title, link: it.link, desc: it.desc.slice(0,200), date: it.date });
  }
}
fs.writeFileSync(dir + '/../extracted.json', JSON.stringify(out, null, 2), 'utf8');
console.log('total AI items:', out.length, '-> extracted.json');
