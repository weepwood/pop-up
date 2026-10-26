# DESIGN REFERENCES · pop-up collection (2026-10)

本项目是个人 UI 设计学习与复刻资料库。当前优化以 **信息层级、交互效率、组件一致性、响应式与可访问性** 为目标，不复制任何参考项目的大段源代码、图形素材或字体文件。

## 外部参考

### X / 社区设计研究

- [@MananTank_ · Flightcast UI 四张设计](https://x.com/MananTank_/status/2114324822612480049) —— 从完整后台界面学习左侧导航、工具栏、内容工作区和上下文面板的关系。项目对应 `flightcast.html`，**首页不照搬后台密集布局**，而是将其归档成独立作品。
- [@jubayer6910 · Newsletter 界面集](https://x.com/jubayer6910/status/2114634027147923544) —— 从系列界面学习同系统内的标签、控件、状态和视觉语言一致性。对应 `newsletter.html`。
- [@damienghader · 设计系统方法分享](https://x.com/damienghader/status/2062156647246475290) —— 先建立 reusable 的设计规则，再用规则组织页面。其观点适合作为设计思路，而不是直接的 CSS 模板。

### GitHub 开源参考

| 项目 | 采用的设计原则 | 当前实现方式 |
|---|---|---|
| [shadcn-ui/ui](https://github.com/shadcn-ui/ui) | 可组合状态、可访问性、组件分类与语义 Token | 原生按钮、ARIA pressed、焦点样式、CSS Token |
| [ibelick/motion-primitives](https://github.com/ibelick/motion-primitives) | 精细的状态过渡，节制使用动画 | CSS 180~220ms 微交互和 reduced-motion 适配 |
| [magicuidesign/magicui](https://github.com/magicuidesign/magicui) | 卡片区块的层次和视觉锚点 | 网格+不同类型的 CSS 微缩模型 |
| [vercel-labs/arcade/design.md](https://github.com/vercel-labs/arcade/blob/main/design.md) | 排版层级、克制中性色、响应式与品牌一致性 | 字号梯度、中性色 Token、单一紫色强调 |

注意：参考库使用 React、Motion、Tailwind 等技术，本项目 **只借鉴设计规律，没有引入它们的运行时或直接复制组件实现**。

## V2 首页的设计决策

- **布局**：1360px 左右的最大阅读范围；桌面三列作品网格，较窄屏幕两列，手机单列；可切换列表模式。
- **品牌**：极简黑白主视觉；紫色只用于强调、微缩图状态和焦点；首页正文留白大于复杂背景装饰。
- **内容**：先看设计族、标题、简述，再打开独立可交互页面。卡片封面由 CSS 绘制，没有外部水印图片。
- **导航**：分类筛选+检索+收藏+快速命令面板，12 个入口全部保持原路由。
- **反馈**：收藏和主题选择存入浏览器 localStorage，轻量 Toast 提示；无网络或账户依赖。
- **动效**：卡片轻微位移/阴影，焦点清晰，尊重 `prefers-reduced-motion`。
- **渐进增强**：静态 HTML 自带全部 12 条链接，即使 JavaScript 无法执行，也能直接进入对应演示。

## 仍需人工校验

- Chrome / Edge / Safari 的字体排版差异，特别是 390px / 768px / 1440px 宽度；
- 深色模式下各种系统文本对比度是否符合 WCAG AA；
- 弹窗键盘焦点闭环和所有单独演示页面的真实浏览器回归；
- 截图视觉误差：此前 X 帖子源图与本地复刻，不能仅凭静态检查宣称逐像素一致。

本文件是实际使用的设计选择记录，并非产品或作者的官方授权或背书。
