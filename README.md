# FlowDebug Workbench 🌊🛠️

**FlowDebug Workbench** 是一个基于 **Electron** 和 **React** 构建的高保真、现代化内容创作与灵感管理工作台。

它不仅是一个简单的笔记应用，更是一个集成了 **AI 智能分析**、**全网热点追踪**以及**卡片式自由创作**的生产力工具。灵感来源于 Flowspace，旨在帮助创作者和开发者高效地收集信息、整理思路并输出内容。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Electron](https://img.shields.io/badge/Electron-29-47848F?logo=electron)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwindcss)
![AI Powered](https://img.shields.io/badge/AI-Gemini%20%7C%20OpenAI%20%7C%20DeepSeek-purple)

## ✨ 核心功能 (Key Features)

### 1. 📊 仪表盘 (Dashboard)
- **生产力热力图**：类似于 GitHub 的贡献图，可视化展示你过去 12 周的创作频率。
- **状态概览**：实时统计待处理草稿、已发布内容及灵感库总数。
- **根据时间自动问候**：温暖的 UI 交互体验。

### 2. 📥 咨询收集 (Consultation)
- **智能链接分析**：粘贴 URL，内置 AI (Gemini/OpenAI) 自动提取标题、生成摘要并打上标签。
- **快速笔记**：随时记录闪念，支持“未读”和“草稿”状态过滤。
- **一键转创作**：将收集到的素材直接转化为创作工坊的草稿。

### 3. 💊 灵感胶囊 (Inspiration Capsule)
- **全网热点聚合**：内置 Tech、Design、Music、Film 等频道。
- **本地化平台支持**：支持查看 **微博 (Weibo)**、**抖音 (Douyin)**、**小红书 (RedBook)** 的热搜趋势。
- **GitHub Trending**：直接集成 GitHub API，查看开发者圈子的热门项目。
- **AI 趋势分析**：开启 AI 模式后，自动分析当前类别的实时病毒式话题（需配置 API Key）。

### 4. 🛠️ 创作工坊 (Creative Workshop)
- **卡片式画布**：
  - **自由拖拽 (Drag & Drop)**：通过卡片顶部的抓手随意调整段落顺序。
  - **自由缩放 (Resizable)**：拖动卡片右下角，自定义每个内容块的尺寸。
  - **所见即所得**：支持图片、文本、标题多种类型卡片。
- **统一文档模式 (Unified Editor)**：
  - 双击任意卡片或点击扩展按钮，进入**全屏 Markdown 编辑器**。
  - 像写文章一样编辑所有卡片内容，保存后自动同步回卡片视图。
  - 支持实时 Markdown 预览。
- **模拟发布**：支持选择发布平台（B站、小红书等）并模拟发布流程。

### 5. 🤖 多模型 AI 支持
- **Google Gemini** (推荐/默认)：支持最新的 Flash 模型，具备强大的上下文理解和搜索能力。
- **OpenAI / DeepSeek**：兼容 OpenAI 格式的 API，支持 DeepSeek-Chat 等国产大模型。
- **密钥保险箱**：支持在设置中安全配置和切换不同的 API Key。

### 6. 💾 数据管理
- **本地优先**：所有数据存储在本地 (LocalStorage)，无需依赖后端数据库。
- **导入/导出**：支持将所有草稿、设置以 JSON 格式导出备份，或迁移至新设备。

---

## 🚀 技术栈 (Tech Stack)

*   **Runtime**: [Node.js](https://nodejs.org/)
*   **Desktop Framework**: [Electron](https://www.electronjs.org/)
*   **Frontend Framework**: [React 19](https://react.dev/)
*   **Build Tool**: [Vite](https://vitejs.dev/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **Icons**: [Lucide React](https://lucide.dev/)
*   **AI SDK**: [@google/genai](https://www.npmjs.com/package/@google/genai)
*   **Markdown**: [react-markdown](https://github.com/remarkjs/react-markdown)

---

## 🛠️ 安装与运行 (Installation)

确保你的电脑上已安装 Node.js (推荐 v18+)。

1.  **克隆项目**
    ```bash
    git clone https://github.com/your-username/flowdebug-workbench.git
    cd flowdebug-workbench
    ```

2.  **安装依赖**
    ```bash
    npm install
    ```

3.  **开发模式运行 (Web 预览)**
    如果你只想在浏览器中调试 UI：
    ```bash
    npm run dev
    ```

4.  **桌面端运行 (Electron)**
    启动 Electron 窗口进行完整体验：
    ```bash
    npm run build
    # 然后根据 electron-builder 的配置运行，或者在开发环境中使用:
    # npm run dev (如果配置了 concurrently 或 vite-plugin-electron 自动启动)
    # 通常对于此模板：
    npm run dev
    # 这将同时启动 Vite 服务器和 Electron 窗口
    ```

5.  **构建生产版本**
    打包为 .exe (Windows) 或 .dmg (Mac)：
    ```bash
    npm run build
    ```
    构建产物将位于 `dist` 或 `release` 目录中。

---

## ⚙️ 配置说明 (Configuration)

### AI 设置
1. 点击左下角的 **Settings** 齿轮图标。
2. 在 **Provider Selection** 中选择你偏好的模型 (Gemini, OpenAI, 或 DeepSeek)。
3. 输入对应的 **API Key**。
   - *Gemini 用户提示*：如果未填写，将尝试使用环境变量中的 Key，建议直接在 UI 中填写以获得最佳体验。
   - *DeepSeek 用户提示*：Base URL 默认为 `https://api.deepseek.com`。
4. 点击 **Save Config** 保存。

### 快捷键
- **Enter**: 在输入框中确认添加。
- **双击卡片**: 进入统一文档编辑模式。

---

## 🤝 贡献 (Contributing)

欢迎提交 Pull Requests 或 Issues！

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的修改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启一个 Pull Request

---

## 📄 许可证 (License)

本项目采用 [MIT License](LICENSE) 开源。

---

**FlowDebug Workbench** - Code, Create, Flow.
