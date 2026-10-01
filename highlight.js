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
  var esc = function (s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); };
  var re = new RegExp("(" + KW.map(esc).join("|") + ")", "gi");

  function highlightText(node) {
    var t = node.nodeValue;
    re.lastIndex = 0;
    if (!re.test(t)) return;
    re.lastIndex = 0;
    var frag = document.createDocumentFragment();
    var last = 0, m;
    while ((m = re.exec(t)) !== null) {
      if (m.index > last) frag.appendChild(document.createTextNode(t.slice(last, m.index)));
      var s = document.createElement("span");
      s.className = "kw";
      s.textContent = m[0];
      frag.appendChild(s);
      last = m.index + m[0].length;
    }
    if (last < t.length) frag.appendChild(document.createTextNode(t.slice(last)));
    node.parentNode.replaceChild(frag, node);
  }

  function walk(node) {
    if (node.nodeType === 3) { highlightText(node); return; }
    if (node.nodeType === 1 && node.tagName !== "A" && node.tagName !== "SCRIPT" && node.tagName !== "STYLE") {
      var children = Array.prototype.slice.call(node.childNodes);
      children.forEach(walk);
    }
  }

  var scope = document.querySelectorAll(".summary p, .item .title, .item .k");
  for (var i = 0; i < scope.length; i++) walk(scope[i]);
})();
