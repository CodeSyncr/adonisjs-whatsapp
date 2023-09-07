/*
 * @brighthustle/adonisjs-whatsapp
 *
 * (c) Brighthustle
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import app from '@adonisjs/core/services/app'
import Whatsapp from '../src/whatsapp.js'

let whatsapp: Whatsapp

/**
 * Returns a singleton instance of the Whatsapp manager from the
 * container
 */
await app.booted(async () => {
  whatsapp = await app.container.make('whatsapp')
})

export { whatsapp as default }
