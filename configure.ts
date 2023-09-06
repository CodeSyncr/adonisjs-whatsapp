/*
 * @adonisjs/transmit
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type Configure from '@adonisjs/core/commands/configure'

export async function configure(command: Configure) {
  // Publish config file
  await command.publishStub('config/mail.stub')

  const codemods = await command.createCodemods()

  // Add provider to rc file
  await codemods.updateRcFile((rcFile: any) => {
    rcFile.addProvider('@brighthustle/adonisjs-whatsapp/whatsapp_provider')
  })
}
