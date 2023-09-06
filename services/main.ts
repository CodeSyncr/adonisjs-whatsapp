/*
 * @adonisjs/whatsapp
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import app from '@adonisjs/core/services/app'
import type { WhatsAppCloudApiService } from '../src/types/main.js'

let whatsapp: WhatsAppCloudApiService

/**
 * Returns a singleton instance of the Redis manager from the
 * container
 */
await app.booted(async () => {
  whatsapp = await app.container.make('whatsapp')
})

export { whatsapp as default }
