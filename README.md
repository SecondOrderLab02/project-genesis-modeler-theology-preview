# Project Genesis — 建模者神学假说

一页式中文哲学与计算实验展示站，适合部署到 GitHub Pages。站点以六段故事引出建模者神学假说；Genesis-1 虚拟地球在故事滚动过程中固定于画面中央，可旋转、缩放并点选 Agent。之后展示实验结果边界与 63 项原始档案附件。

## 本地预览

页面没有构建步骤或 API key。由于 3D 场景使用 ES modules，请通过本地静态服务器预览（例如 VS Code Live Server 或 `npx serve .`），不要用 `file://` 直接打开。部署后的 GitHub Pages 页面可直接运行。Three.js r187 与 OrbitControls 通过 jsDelivr CDN 加载；线上字体来自 Google Fonts，断网时字体会回退到系统字体。

## 发布到 GitHub Pages

1. 将本目录推送到一个 GitHub 仓库。
2. 在仓库打开 **Settings → Pages**。
3. 选择 **Deploy from a branch**，分支选 `main`，目录选 `/ (root)`，保存。
4. 等待 GitHub Pages 部署完成，页面地址会显示在同一设置页。

本站素材总量约 38 MB，其中项目历史 ZIP 原样保留。地球使用 Three.js 构建，程序化生成表面，不依赖外部地图瓦片。页面视觉视角参考 [God’s Eye View](https://github.com/bilawalsidhu/gods-eye-view)；未复制其源码。Three.js 与示例控制器为 MIT 许可项目。项目数据、报告和旧版本包来自随项目提供的原始附件，其各自授权状态请以原包说明为准。

模拟是确定性规则驱动的展示性世界，不调用真实地理数据或生成式 Agent，不构成意识、自由意志或现实起源的证据。页面中的实验结论按 `public/experiments/PROJECT_GENESIS_FINAL_REPORT.md` 与 `G4.7_report.md` 的限定表述。
