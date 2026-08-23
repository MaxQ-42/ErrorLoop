# 错题回路 / ErrorLoop

面向中国高中高考复习的个人错题管理 PWA。V0.1 聚焦「上传 → 扫描 → 分类 → 保存 → 查看」。

## 本地启动

需要 Node.js 20+ 与 pnpm（或 npm）。

```bash
pnpm install
pnpm dev --host
```

在电脑打开终端显示的地址（通常为 `http://localhost:5173`）。同一 Wi-Fi 下，手机打开终端显示的 Network 地址即可测试；Android Chrome 菜单中选择“添加到主屏幕”即可安装。

```bash
pnpm lint
pnpm build
```

## 当前数据模式

未配置 CloudBase 时，应用使用浏览器本地存储，便于完整测试录入流程。不要在浏览器清除站点数据，否则本地测试数据会消失。

图片在本地开发模式中以浏览器数据形式保存；生产 CloudBase 模式会将原图与扫描图分别上传至 Storage，数据库只保留文件路径和元数据。

## 配置 CloudBase（下一步）

1. 登录 [腾讯云 CloudBase 控制台](https://console.cloud.tencent.com/tcb)，创建环境。
2. 在环境的“身份认证”中启用匿名登录或手机号登录（正式使用建议手机号登录）。
3. 在“数据库”创建 `questions`、`papers`、`boards`、`user_settings` 集合，并按 `userId` 配置读写权限隔离。
4. 在“云存储”启用存储；图片应按 `users/{userId}/questions|papers/{recordId}/original|scanned/` 写入。
5. 复制 `.env.example` 为 `.env.local`，填写 `VITE_CLOUDBASE_ENV_ID`。不要提交该文件。
6. 在完成 CloudBase 登录策略与权限规则后，将 `src/services/repository.ts` 的本地适配器替换为 CloudBase 适配器；界面与数据类型不需要修改。

不要把管理员密钥、用户图片或用户数据提交到 GitHub。

## 项目结构

- `src/types`：题目、试卷、板块与图片资产模型
- `src/services/scanner.ts`：浏览器端图像缩放、彩色增强、灰度扫描
- `src/services/repository.ts`：本地开发数据适配器
- `src/services/cloudbase.ts`：CloudBase 路径与环境配置边界
- `src/config/imageConfig.ts`：统一图片大小与质量参数
