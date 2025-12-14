### 1. 下载依赖
   `npm install`
### 2. 设置模型 `QWEN_MODEL` 在 [.env.local](.env.local) 中
```

QWEN_MODEL=qwen-plus  # 可选: qwen-plus, qwen-max
```
   
   纯前端项目 调用 qwen 有 CORS 跨域问题 可自行查看 qwenService.ts 写 Server.js 实现本地转发端口

Tutorial：
这是一个简单的 Node.js 后端服务，用于解决前端直接调用阿里云 Qwen (DashScope) API 时的 CORS 跨域报错问题。它充当中转站，将前端请求转发给阿里云，并将结果返回给前端。



#### 2.1. 初始化项目

打开终端（Terminal），执行以下命令创建项目文件夹并初始化：

```bash
mkdir my-proxy-server
cd my-proxy-server
npm init -y
```

#### 2.2 安装依赖

安装必要的 Node.js 包：
*   `express`: Web 服务器框架
*   `cors`: 处理跨域资源共享
*   `dotenv`: 加载环境变量（API Key）

```bash
npm install express cors dotenv
```

#### 2.3 创建服务器文件

在项目根目录下新建文件 `server.js`，并填入以下代码：

```javascript
// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const port = 3001; // 后端运行在 3001 端口，避开前端常用的 3000

// 允许跨域
app.use(cors());
// 允许解析 JSON 请求体
app.use(express.json());

// Qwen API 配置
const API_KEY = process.env.QWEN_API_KEY; // 从 .env 文件读取
const API_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';

app.post('/api/chat', async (req, res) => {
  try {
    const { messages, systemPrompt, model } = req.body;

    // 这里在服务器端向阿里云发起请求
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'X-DashScope-SSE': 'disable'
      },
      body: JSON.stringify({
        model: model || 'qwen-turbo',
        input: {
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages
          ]
        },
        parameters: {
          temperature: 0.7,
          result_format: 'message',
          incremental_output: false
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    // 把阿里云的结果直接转发回前端
    res.json(data);

  } catch (error) {
    console.error('Proxy Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`本地代理服务器正在运行: http://localhost:${port}`);
});
```

#### 2.4 配置环境变量

在项目根目录下新建一个名为 `.env` 的文件，填入您的阿里云 API Key：

```env
QWEN_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx
```
> **注意**：请将 `sk-xxxxxxxxxxxxxxxxxxxxxxxx` 替换为您真实的阿里云 DashScope API Key。

#### 2.5 启动后端

在终端运行以下命令启动后端服务：

```bash
node server.js
```

成功启动后，终端将显示：
> 本地代理服务器正在运行: http://localhost:3001

请**保持此终端窗口开启**，不要关闭。

### 3. 运行项目:
   `npm run dev`
