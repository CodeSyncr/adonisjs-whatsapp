import type { WhatsAppConfig } from './types/main.js'
import { RuntimeException } from '@poppinss/utils'

export function defineConfig<T extends WhatsAppConfig>(config: T): T {
  if (!config) {
    throw new RuntimeException('Invalid config. It must be an object')
  }

  if (!config.accessToken) {
    throw new RuntimeException('Invalid access token. It must be an string')
  }

  if (!config.phoneNumberId) {
    throw new RuntimeException('Invalid phone number id. It must be an string')
  }

  if (!config.accessToken) {
    throw new RuntimeException('Invalid access token. It must be an string')
  }

  if (!config.verifyToken) {
    throw new RuntimeException('Invalid verify token. It must be an string')
  }

  return config
}
