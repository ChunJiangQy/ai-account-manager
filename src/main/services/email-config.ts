import Store from 'electron-store'

interface EmailConfig {
  qq_mail?: {
    address: string
    password: string
    imap_server: string
    imap_port: number
  }
  gmail?: {
    address: string
    password: string
    imap_server: string
    imap_port: number
  }
  erine_email?: {
    username: string
    domain: string
  }
}

interface ConfigSchema {
  email: EmailConfig
}

const configStore = new Store<ConfigSchema>({
  name: 'email-config',
  defaults: {
    email: {}
  }
})

export function getEmailConfig(): EmailConfig {
  return configStore.get('email', {})
}

export function saveEmailConfig(config: EmailConfig): void {
  configStore.set('email', config)
}
