/*
 * @brighthustle/adonisjs-whatsapp
 *
 * (c) Brighthustle
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { WhatsappService } from './main.js'
declare module '@adonisjs/core/types' {
  export interface ContainerBindings {
    whatsapp: WhatsappService
  }
}
