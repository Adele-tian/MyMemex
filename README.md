# MyMemex

一个基于 Next.js 14 和 InsForge 构建的个人知识与日记系统，用来记录日常想法、追踪习惯、查看情绪变化，并把零散内容沉淀成可回顾的个人记忆库。

## 项目亮点

- 日记记录：按日期撰写和保存每日内容，自动提取标题
- 情绪追踪：支持心情等级记录，方便回看状态变化
- 习惯打卡：内置 `早睡`、`学习 AI`、`运动`、`阅读` 四类习惯追踪
- 搜索与回顾：支持全文搜索、按日期浏览，以及“On This Day”式历史回看
- 数据可视化：结合日记与习惯数据进行基础分析展示
- 登录鉴权：基于 NextAuth + InsForge 的邮箱密码登录
- 注册与邮箱验证：支持新用户注册及邮箱验证流程
- 数据导入导出：支持 JSON 备份导入，也支持导出 Markdown / JSON
- 响应式界面：同时适配桌面和移动端

## 技术栈

- Framework: Next.js 14 App Router
- Language: TypeScript
- UI: React 18 + Tailwind CSS 3.4 + Lucide Icons
- Auth: NextAuth
- Backend: InsForge SDK
- Database: PostgreSQL via InsForge
- Deploy: Vercel

## 目录结构

```text
MyMemex/
├── app/                  # App Router 页面与 API 路由
├── components/           # 业务组件与界面模块
├── lib/                  # 鉴权、存储、工具方法、类型定义
├── insforge/schema.sql   # 初始化数据库表结构
├── package.json
└── README.md
```

## 本地启动

始终在项目目录下运行：

```bash
cd /Users/admin/Knowlegde_Per_Assis/MyMemex
```

安装依赖：

```bash
npm install
```

启动开发环境：

```bash
npm run dev
```

默认访问地址：

```text
http://localhost:3000
```

如果 `3000` 端口被占用，Next.js 会自动切换到下一个可用端口。

## 环境变量

在项目根目录创建 `.env.local`，至少包含以下内容：

```bash
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000
INSFORGE_BASE_URL=https://your-app.region.insforge.app
INSFORGE_ANON_KEY=your-insforge-anon-key
```

生产环境中，这些变量也需要同步配置到部署平台。

当前仓库约定的生产域名为：

```text
https://my-memex.vercel.app
```

如果你使用这个域名，`NEXTAUTH_URL` 在生产环境应设置为上面的正式地址。

## 数据库初始化

首次运行前，需要先执行数据库脚本：

[`insforge/schema.sql`](/Users/admin/Knowlegde_Per_Assis/MyMemex/insforge/schema.sql)

该脚本会创建：

- `notes` 表：存储日记内容、标签、情绪、日期
- `habit_checkins` 表：存储每日习惯打卡
- `updated_at` 自动更新时间触发器

如果你使用 InsForge SQL 工具，直接执行完整的 `schema.sql` 一次即可。

## 可用脚本

```bash
npm run dev        # 开发模式
npm run build      # 生产构建
npm run start      # 启动生产服务
npm run lint       # 代码检查
npm run typecheck  # TypeScript 类型检查
npm run clean      # 清理 .next 缓存
```

## 推荐验证流程

提交到 GitHub 或部署前，建议至少执行：

```bash
npm run typecheck
npm run build
```

如果你需要本地模拟生产运行：

```bash
npm run start
```

## 常见问题

### 1. `Cannot find module './xxx.js'`

这通常是 Next.js 开发缓存或热更新异常，不一定是业务代码问题。可按下面步骤处理：

```bash
npm run clean
npm run dev
```

如果还有问题，先确认是否有旧的 `next dev` 进程没有退出。

### 2. 页面可以打开，但数据加载失败

优先检查以下配置：

- `INSFORGE_BASE_URL` 是否正确
- `INSFORGE_ANON_KEY` 是否正确
- 数据库是否已执行 [`insforge/schema.sql`](/Users/admin/Knowlegde_Per_Assis/MyMemex/insforge/schema.sql)
- 当前用户是否已完成登录

### 3. 登录成功后仍然无法访问主页

检查以下项：

- `NEXTAUTH_SECRET` 是否已设置
- `NEXTAUTH_URL` 是否和当前访问地址一致
- 生产环境变量是否已同步到 Vercel

## API 概览

项目内已包含以下主要接口：

- `POST /api/auth/register`：注册用户
- `POST /api/auth/[...nextauth]`：登录鉴权
- `POST /api/auth/verify-email`：邮箱验证
- `POST /api/auth/resend-verification`：重发验证邮件
- `GET /api/notes`：获取日记
- `POST /api/notes`：创建日记
- `PUT /api/notes/update-delete`：更新日记
- `DELETE /api/notes/update-delete`：删除日记
- `GET /api/habits`：获取习惯打卡
- `POST /api/habits`：保存习惯打卡

## 部署说明

推荐部署到 Vercel。

部署前请确认：

1. 已将本仓库连接到 Vercel
2. 已在 Vercel 配置所有环境变量
3. 已在 InsForge 执行数据库初始化脚本
4. `NEXTAUTH_URL` 已设置为线上正式域名

## GitHub 维护建议

如果你准备继续维护这个仓库，建议把下面几项也逐步补上：

- `LICENSE`：明确开源协议
- `.env.example`：提供最小环境变量模板
- 项目截图：提升 README 展示效果
- GitHub Actions：增加 `typecheck` 和 `build` 自动校验
- Issue / PR Templates：统一协作流程

## 后续可扩展方向

- 标签体系和高级筛选
- 富文本或 Markdown 编辑增强
- 更完整的数据统计看板
- 云端同步与多端体验优化
- AI 总结、检索、回顾能力

## License

当前仓库尚未声明许可证。如果你准备公开维护，建议尽快补充。
