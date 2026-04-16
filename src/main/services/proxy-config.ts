import Store from 'electron-store'

interface ModelMapping {
  [key: string]: string  // Claude模型名 -> 实际模型名
}

interface ProxyConfig {
  defaultModel: string
  modelMapping: ModelMapping
}

interface ConfigSchema {
  proxy: ProxyConfig
}

const configStore = new Store<ConfigSchema>({
  name: 'proxy-config',
  defaults: {
    proxy: {
      defaultModel: 'glm-5.1',
      modelMapping: {
        'claude-3-5-sonnet-20241022': 'glm-5.1',
        'claude-3-5-sonnet-20240620': 'glm-5.1',
        'claude-3-opus-20240229': 'glm-5.1',
        'claude-3-sonnet-20240229': 'glm-5.1',
        'claude-3-haiku-20240307': 'glm-5.1',
        'claude-sonnet-4-20250514': 'glm-5.1',
        'claude-opus-4-20250514': 'glm-5.1'
      }
    }
  }
})

export function getProxyConfig(): ProxyConfig {
  return configStore.get('proxy')
}

export function saveProxyConfig(config: ProxyConfig): void {
  configStore.set('proxy', config)
}

export function mapModel(requestedModel: string): string {
  const config = getProxyConfig()

  // 如果有映射，使用映射的模型
  if (config.modelMapping[requestedModel]) {
    return config.modelMapping[requestedModel]
  }

  // 如果请求的是 Claude 模型但没有映射，使用默认模型
  if (requestedModel.startsWith('claude-')) {
    return config.defaultModel
  }

  // 否则使用原始模型名
  return requestedModel
}
