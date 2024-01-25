/*
 * @brighthustle/adonisjs-whatsapp
 *
 * (c) Brighthustle
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type { WhatsAppConfig } from './types/main.js'
import { RuntimeException } from '@poppinss/utils'

export function defineConfig<T extends WhatsAppConfig>(config: T): T {
  if (!config) {
    throw new RuntimeException('Invalid config. It must be an object')
  }

  if (!config.provider) {
    throw new RuntimeException('Invalid provider. It must be lucid or local')
  }

  if (!config.config.webhookRoute) {
    throw new RuntimeException('Invalid webhook route. It must be string')
  }

  return config
}
