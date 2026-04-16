const fs = require('fs');
const Store = require('electron-store').default;

// 读取旧账号数据
const oldAccounts = JSON.parse(fs.readFileSync('../Kiro-auto-register-main/windsurf_api_accounts.json', 'utf8'));

// 转换格式
const newAccounts = oldAccounts.map(acc => ({
  app: 'windsurf',
  email: acc.email,
  password: '',
  apiKey: acc.api_key,
  tier: acc.tier,
  status: acc.status,
  models: acc.models,
  credits: acc.credits
}));

// 保存到新的 store
const store = new Store({
  name: 'config',
  projectName: 'ai-account-manager'
});
const existing = store.get('accounts', []);

// 去重：检查邮箱是否已存在
const existingEmails = new Set(existing.map(a => a.email));
const toAdd = newAccounts.filter(a => !existingEmails.has(a.email));

const merged = [...existing, ...toAdd];
store.set('accounts', merged);

console.log(`成功导入 ${toAdd.length} 个账号 (跳过 ${newAccounts.length - toAdd.length} 个重复账号)`);
