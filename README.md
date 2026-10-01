# AI 每日精选

每天 7:00 自动更新的 AI 新闻聚合站，汇集全球人工智能要闻，并附简要影响分析。

- 线上地址：<https://cty66699.github.io/ai-daily/>
- 更新频率：每天早上 7:00（Asia/Shanghai）
- 内容来源：IT之家、36氪、Solidot 等公开 RSS 源

## 目录结构

```
index.html          最新一期（首页）
archive/            按日期归档的历史期次
style.css           站点样式
parse.js            抓取 + 解析 RSS 的脚本（自动化任务调用）
```

## 内容格式

每期包含：**大字总括**（当日核心信号）+ 分主题的详细条目，每条附「亮点」与「影响推测」。

## 如何更新

由 OpenClaw 的定时任务自动完成：每天 7:00 抓取 RSS → 过滤 AI 相关条目 → 生成内容 → 写入 `index.html` 与 `archive/YYYY-MM-DD.html` → 提交推送。

数据与内容由 AI 自动整理，仅供参考，不构成投资建议。
