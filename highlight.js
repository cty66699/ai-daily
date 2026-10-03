(function () {
  var KW = [
    "OpenAI", "Anthropic", "ChatGPT", "Claude", "Gemini", "DeepSeek", "Llama",
    "Google", "谷歌", "Microsoft", "微软", "NVIDIA", "英伟达", "AMD", "Meta", "xAI",
    "华为", "腾讯", "软银", "阿里", "字节跳动", "苹果", "Apple", "甲骨文", "Oracle",
    "美光", "Micron", "三星", "特斯拉", "福特", "戴尔", "Dell", "World Labs", "李飞飞",
    "月之暗面", "Kimi", "Grok", "马斯克",
    "GPT", "麒麟", "昇腾",
    "大模型", "大语言模型", "生成式AI", "生成式人工智能", "人工智能", "通用人工智能", "AGI",
    "蒸馏", "算力", "芯片", "数据中心", "推理", "训练", "微调", "多模态", "智能体",
    "人形机器人", "自动驾驶", "具身智能", "半导体", "HBM", "GPU", "CUDA", "存储",
    "融资", "IPO", "估值", "开源", "闭源", "主权AI", "出口管制"
  ];
  KW.sort(function (a, b) { return b.length - a.length; });

  // 术语 → 一句话注释（只在每页「首次出现」处补一个括号，避免刷屏）
  var NOTES = {
    "openai": "美国 AI 公司，ChatGPT 的开发者",
    "anthropic": "美国 AI 公司，Claude 的开发者",
    "chatgpt": "OpenAI 的对话 AI 产品",
    "claude": "Anthropic 的对话 AI 模型",
    "gemini": "谷歌的对话 AI 模型",
    "deepseek": "中国的开源大模型公司",
    "llama": "Meta 的开源大模型",
    "google": "美国科技巨头",
    "谷歌": "美国科技巨头",
    "microsoft": "美国软件巨头，OpenAI 大股东",
    "微软": "美国软件巨头，OpenAI 大股东",
    "nvidia": "全球最大的 AI 芯片厂商",
    "英伟达": "全球最大的 AI 芯片厂商",
    "amd": "美国芯片厂商，英伟达的竞争对手",
    "meta": "Facebook 母公司",
    "xai": "马斯克创办的 AI 公司",
    "华为": "中国通信与芯片巨头",
    "腾讯": "中国互联网巨头",
    "软银": "日本投资集团",
    "阿里": "阿里巴巴，中国互联网巨头",
    "字节跳动": "抖音 / TikTok 母公司",
    "苹果": "美国消费电子巨头",
    "apple": "美国消费电子巨头",
    "甲骨文": "美国数据库与云服务商",
    "oracle": "美国数据库与云服务商",
    "美光": "美国存储芯片厂商",
    "micron": "美国存储芯片厂商",
    "三星": "韩国电子与存储芯片巨头",
    "特斯拉": "美国电动车与机器人公司",
    "福特": "美国汽车厂商",
    "戴尔": "美国电脑厂商",
    "dell": "美国电脑厂商",
    "world labs": "李飞飞创办的空间智能公司",
    "李飞飞": "知名 AI 学者，斯坦福教授",
    "月之暗面": "中国的 AI 公司，Kimi 的开发者",
    "kimi": "月之暗面的对话 AI 模型",
    "grok": "马斯克 xAI 的对话 AI 模型",
    "马斯克": "特斯拉 / xAI / SpaceX 的创始人",
    "gpt": "OpenAI 的大模型系列",
    "麒麟": "华为的处理器芯片系列",
    "昇腾": "华为的 AI 芯片系列",
    "大模型": "参数规模极大、能力通用的 AI 模型",
    "大语言模型": "专门处理语言的超大 AI 模型",
    "生成式ai": "能自动生成文字 / 图片 / 音视频的 AI",
    "生成式人工智能": "能自动生成文字 / 图片 / 音视频的 AI",
    "人工智能": "让机器模拟人类智能的技术",
    "通用人工智能": "能力全面达到人类水平、可跨任务通用的 AI",
    "agi": "能力全面达到人类水平、可跨任务通用的 AI",
    "蒸馏": "让小模型学习大模型，以压缩成本",
    "算力": "计算能力，AI 训练的核心资源",
    "芯片": "集成电路，AI 算力的硬件基础",
    "数据中心": "集中堆放服务器、对外提供算力的设施",
    "推理": "AI 模型实际运行、回答问题的过程",
    "训练": "用海量数据「教会」模型的过程",
    "微调": "在已有大模型上做小规模再训练",
    "多模态": "能同时处理文字、图像、音频等多种信息",
    "智能体": "能自主规划并执行多步任务的 AI（Agent）",
    "人形机器人": "外形像人的机器人",
    "自动驾驶": "车辆无需人工即可行驶的技术",
    "具身智能": "有实体、能感知并作用于物理世界的 AI",
    "半导体": "芯片的原材料与产业",
    "hbm": "高带宽内存，AI 芯片用的高速显存",
    "gpu": "图形处理器，AI 计算的主力芯片",
    "cuda": "英伟达的 GPU 编程平台（其软件护城河）",
    "存储": "内存与硬盘等数据存储",
    "融资": "向投资方筹集资金",
    "ipo": "首次公开募股，即公司上市",
    "估值": "市场给一家公司的定价",
    "开源": "公开源码，允许他人使用与修改",
    "闭源": "不公开源码，仅自家可控",
    "主权ai": "各国自建、自主可控的 AI 能力",
    "出口管制": "政府限制特定技术或产品出口"
  };

  var esc = function (s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); };
  var re = new RegExp("(" + KW.map(esc).join("|") + ")", "gi");
  var noted = {}; // 本页已注释过的术语（小写）

  function highlightText(node, allowNote) {
    var t = node.nodeValue;
    re.lastIndex = 0;
    if (!re.test(t)) return;
    re.lastIndex = 0;
    var frag = document.createDocumentFragment();
    var last = 0, m;
    while ((m = re.exec(t)) !== null) {
      if (m.index > last) frag.appendChild(document.createTextNode(t.slice(last, m.index)));
      var key = m[0].toLowerCase();
      var s = document.createElement("span");
      s.className = "kw";
      s.textContent = m[0];
      frag.appendChild(s);
      if (allowNote && NOTES[key] && !noted[key]) {
        noted[key] = 1;
        var n = document.createElement("span");
        n.className = "kw-note";
        n.textContent = "（" + NOTES[key] + "）";
        frag.appendChild(n);
      }
      last = m.index + m[0].length;
    }
    if (last < t.length) frag.appendChild(document.createTextNode(t.slice(last)));
    node.parentNode.replaceChild(frag, node);
  }

  function walk(node, allowNote) {
    if (node.nodeType === 3) { highlightText(node, allowNote); return; }
    if (node.nodeType === 1 && node.tagName !== "A" && node.tagName !== "SCRIPT" && node.tagName !== "STYLE" && node.className !== "kw-note") {
      var children = Array.prototype.slice.call(node.childNodes);
      children.forEach(function (c) { walk(c, allowNote); });
    }
  }

  // 先正文（总括 + 条目正文：首次出现处补注释），再标题（只标红、不加注释）
  var body = document.querySelectorAll(".summary p, .item .k");
  for (var i = 0; i < body.length; i++) walk(body[i], true);
  var titles = document.querySelectorAll(".item .title");
  for (var j = 0; j < titles.length; j++) walk(titles[j], false);
})();
