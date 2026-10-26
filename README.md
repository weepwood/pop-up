# pop-up · UI Design Collection

基于 HTML、CSS 和 JavaScript 的交互式 UI 复刻作品集，支持 GitHub Pages 自动部署。首页现为 **统一作品导航页**，原安装弹窗保留在独立地址，所有页面均可从首页进入。

**在线体验**：[作品导航](https://weepwood.github.io/pop-up/) · [安装弹窗](https://weepwood.github.io/pop-up/install.html) · [Newsletter 设计](https://weepwood.github.io/pop-up/newsletter.html)

## 页面入口

| 页面 | 路由 | 功能 |
| --- | --- | --- |
| UI Gallery | `index.html` | 8 个页面入口、分类筛选、关键词搜索、卡片预览 |
| Install Homepage pop-up | `install.html` | 脚本/内嵌/分享三种安装方式，代码复制与引导 |
| Create campaign | `newsletter.html?screen=campaign` | 4 步邮件活动向导和本地草稿 |
| Add subscribers | `newsletter.html?screen=subscribers` | 邮箱验证、批量录入和标签 |
| Import subscribers | `newsletter.html?screen=import` | CSV 解析、映射、复核导入 |
| Create offer | `newsletter.html?screen=offer` | 优惠折扣、价格实时预览 |
| Storefront demo | `demo-site.html` | 用于测试订阅弹窗的示例商店 |
| Share link form | `share.html` | 直接访问的订阅表单页面 |
| Granola workspace sidebar | `granola.html` | 3 栏侧边栏 Home / Workspace / Activity 交互复刻 |

> 首页共展示 8 个交互界面入口（安装弹窗 + Newsletter 四个页面 + 2 个演示页面 + Granola 风格侧栏）。`newsletter.html` 的 4 个入口通过 `screen` 查询参数切换状态。

### 快速运行

```bash
python -m http.server 5173
```

打开 `http://localhost:5173/`，从目录中选择要预览的页面。

### 项目文件

- `index.html` / `gallery.css` / `gallery.js`：作品首页及筛选，`granola-preview.css` 为侧栏缩略图。
- `install.html` / `styles.css` / `main.js`：安装弹窗。
- `newsletter.html` / `newsletter.css` / `newsletter.js`：四个 Newsletter UI。
- `demo-site.html` / `share.html` / `forms/v2.js`：本地演示订阅流程。
- `granola.html` / `granola.css` / `granola.js`：Granola 风格 Home / Workspace menu / Activity 三栏交互原型。
- `scripts/check_local_links.py`：自动验证所有静态页面及首页入口。
- `.github/workflows/deploy.yml`：GitHub Actions 自动部署 GitHub Pages。

### 部署与验证

向 `main` 分支推送代码后 GitHub Actions 将检查必需文件、JavaScript 语法和所有页面的本地资源链接，之后上传静态站点并部署到 GitHub Pages。手动运行工作流同样支持。

### 数据与原型说明

Newsletter 联系人、活动草稿、优惠记录及订阅测试信息保存在当前浏览器的 `localStorage` 中。**这是本地交互演示，不会实际发送邮件、收费或向服务端存储数据。** 新 UI 参考 [X 原帖](https://x.com/jubayer6910/status/2114634027147923544)，并非原产品正式实现。

---

## 早期开发说明

# Install Homepage pop-up — UI 复刻与交互演示

基于提供的第一张截图复刻安装弹窗，同时实现 **Pop-up script / Inline embed / Share link** 三种安装状态。纯 HTML、CSS、JavaScript，不需要安装依赖或打包。

## 快速运行

在项目目录执行：

```bash
python -m http.server 5173
```

浏览器打开 http://localhost:5173/ 。也可以使用 VS Code Live Server。

## 项目结构

| 文件 | 内容 |
| --- | --- |
| `index.html` | 安装弹窗与对话框主界面 |
| `styles.css` | 布局、字体、颜色、响应式样式 |
| `main.js` | Tab 切换、代码生成、复制、设置、教程、检测状态 |
| `forms/v2.js` | 自带的可运行订阅弹窗 / 行内嵌入脚本 |
| `demo-site.html` | 安装脚本后的示例商店页面 |
| `share.html` | 可分享的独立订阅表单页面 |

## 已实现的交互

1. 三种安装方法切换，生成对应代码或分享链接。
2. 一键复制代码 / 链接，复制成功后反馈。支持键盘操作和移动端。
3. Shopify、WordPress、Webflow 三个简明安装引导弹窗。
4. “Email to developer” 创建包含安装代码的本地邮箱草稿，是否发送由用户在邮件应用中决定。
5. Done / X 关闭、重新打开弹窗。
6. 点击底部说明文字打开配置界面，编辑域名、Workspace ID、Form ID、开发者邮箱；也可以使用 `Alt + S` 快捷键。
7. 可运行的本地订阅脚本：弹窗、行内嵌入、邮箱格式验证、成功反馈。测试邮箱保存在当前浏览器 `localStorage`。
8. 打开 `demo-site.html` 后，安装页通过本地记录更新“Detected”状态。
9. 可以直接打开 `index.html?tab=inline` 和 `index.html?tab=share` 查看另外两个状态。

## 边界与注意事项

- **不是原站 LoopO 的正式 SDK**。截图中的 `cdn.loopo.app/forms/v2.js` 仅为视觉参考；项目提供独立的 `forms/v2.js`。生成的代码使用当前项目实际文件地址，便于验证功能。生产部署需要把脚本上传至可访问的 HTTPS 地址，然后更换代码中的脚本 URL。
- 初始绿色“Detected”文案是**截图的示例数据**，不是对真实 `harborandco.com` 的检测。打开本地示例网站之后，状态会更新为本地实际记录；没有对外部网站进行网络探测。
- **没有真实的邮件订阅后端**：表单输入仅保存在本地浏览器，用于展示 UI 与交互流程。正式上线需要后端 API、存储、安全验证、限流、隐私政策与同意机制。
- 本次能够读取并检查的图片素材只有第一张；另外两张上传图未提供可访问的独立素材，因此新增 Tab 页面目前是根据首张图的设计语言推演实现，不能保证与新增截图逐像素一致。
- 浏览器自动化测试在当前环境被访问策略阻止；已执行 JS 语法、HTML 元素 ID 重复与必要文件存在性检查，建议在本机按下方清单验收实际渲染。

## 本地验收建议

- 切换 3 个 Tab、执行复制，确认代码与 URL 内容。
- 打开 Share link，输入邮箱并确认成功状态。
- 打开 `demo-site.html`，等待订阅弹窗并提交一个测试邮箱。
- 回到安装界面，观察检测状态。
- 修改设置，确认代码中的 workspace / form 值同步变更。
- 逐一测试安装教程、关闭、重新打开、Esc、方向键和窄屏布局。

## Newsletter UI Collection（新增）

访问 [`newsletter.html`](newsletter.html) 或 GitHub Pages 上的 `/newsletter.html`。主页安装弹窗的教程区也提供导航入口。

本页面根据 [Jubayer 的 4 张 Newsletter UI 设计](https://x.com/jubayer6910/status/2114634027147923544) 进行重构，采用独立的 `newsletter.html`、`newsletter.css`、`newsletter.js`，不影响原安装弹窗。

四个可切换界面：
- **Create campaign**：格式卡片、4 步向导、活动草稿保存；
- **Add subscribers**：单人录入、批量粘贴、CSV 文件选择、标签、邮箱验证和去重、欢迎邮件与双重验证开关；
- **Import subscribers**：读取 CSV（含带引号的字段）、字段自动匹配与修改、无效日期提示、导入复核、确认后保存；默认提供 80 行演示数据，其中 18 行日期异常；
- **Create offer**：百分比或金额折扣、期限/资格/优惠码、实时价格预览、分享链接复制与本地保存。

支持桌面与手机、键盘交互，数据写入浏览器 `localStorage`，**不连接真实邮件发送、付款或订阅后台**。X 页面直连限制了原图获取，复刻依据公开收录页的逐张描述和配色信息，未宣称逐像素一致。

部署：`.github/workflows/deploy.yml` 在 `main` 分支推送时自动部署全站到 GitHub Pages，同时验证本页面所需资源和 JavaScript 语法。

## Granola 风格侧栏复刻

源于用户提供的三态工作区侧栏设计图：左 Home、中央工作区切换下拉列表、右 Activity。项目提供 `granola.html` 独立交互演示页面，从首页「Sidebars」分类可以进入。演示可切换 Home/Activity、工作区、导航项目，支持搜索、创建本地聊天与活动、读取未读状态、Esc 关闭和 Ctrl/Cmd+K 搜索。状态在本地浏览器存储，不连接 Granola 官方服务，也不使用其商标资源。
