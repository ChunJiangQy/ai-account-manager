const fs = require('fs');
const path = require('path');
const Store = require('electron-store').default;

// 读取所有 windsurf_credentials 文件
const credDir = '../Kiro-auto-register-main/windsurf_credentials';
const files = fs.readdirSync(credDir).filter(f => f.endsWith('.json'));

const accountsToAdd = [];

for (const file of files) {
  const filePath = path.join(credDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  // 只处理有 email 和 password 但没有 sessionToken 的账号
  if (data.email && data.password && !data.sessionToken) {
    accountsToAdd.push({
      app: 'windsurf',
      email: data.email,
      password: data.password,
      apiKey: '', // 需要后续登录获取
      tier: 'free',
      status: 'active',
      models: ['gpt-4o-mini', 'gemini-2.5-flash', 'glm-5.1'],
      credits: {
        daily_limit: 25,
        daily_used: 0,
        daily_remaining: 25
      }
    });
  }
}

// 保存到 store
const store = new Store({
  name: 'config',
  projectName: 'ai-account-manager'
});

const existing = store.get('accounts', []);
const existingEmails = new Set(existing.map(a => a.email));
const toAdd = accountsToAdd.filter(a => !existingEmails.has(a.email));

const merged = [...existing, ...toAdd];
store.set('accounts', merged);

console.log(`成功添加 ${toAdd.length} 个账号 (跳过 ${accountsToAdd.length - toAdd.length} 个重复账号)`);
console.log('注意: 这些账号需要登录获取 API Key');
