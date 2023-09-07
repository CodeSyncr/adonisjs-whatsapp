/*
 * @brighthustle/adonisjs-whatsapp
 *
 * (c) Brighthustle
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { ApplicationService } from '@adonisjs/core/types'
import {
  WhatsAppConfig,
  WhatsAppMessageContract,
  WhatsAppStatusContract,
} from '../src/types/main.js'
import { HttpContext } from '@adonisjs/core/http'
import Helpers from '../src/helpers.js'

export default class WhatsAppProvider {
  private config = {
    webhookRoute: '/webhook/whatsapp',
    timeout: 60,
    phoneNumberId: null,
    whatsappBusinessId: null,
    accessToken: null,
    verifyToken: null,
    graphUrl: 'https://graph.facebook.com',
    graphVersion: 'v16.0',
  }

  constructor(protected app: ApplicationService) {}

  async register() {
    this.app.container.singleton('whatsapp', async () => {
      const { default: Whatsapp } = await import('../src/whatsapp.js')
      const emitter = await this.app.container.make('emitter')
      const config = this.app.config.get<WhatsAppConfig>('whatsapp', this.config)

      return new Whatsapp(config, emitter)
    })
  }

  async boot() {
    const router: any = await this.app.container.make('router')
    const emitter: any = await this.app.container.make('emitter')
    const config: any = await this.app.container.make('config')
    const logger: any = await this.app.container.make('logger')

    const whatsapp: WhatsAppConfig = config.get('whatsapp', this.config)

    // webhook verifier
    router.get(whatsapp.webhookRoute, (ctx: HttpContext) => {
      const payload = ctx.request.qs()

      if (!payload['hub.mode'] || !payload['hub.verify_token']) {
        return ctx.response.status(400).send({ code: 400 })
      }

      if (
        payload['hub.mode'] !== 'subscribe' ||
        payload['hub.verify_token'] !== whatsapp.verifyToken
      ) {
        return ctx.response.status(403).send({ code: 403 })
      }

      logger.info('Webhook verified!')
      return ctx.response.status(200).send(payload['hub.challenge'])
    })

    // webhook
    router.post(whatsapp.webhookRoute, async (ctx: HttpContext) => {
      const payload = ctx.request.body()

      if (!payload.object) {
        return ctx.response.status(403).send({ code: 403 })
      }

      const { value } = payload.entry[0].changes[0]
      const message = !!value.messages && value.messages[0]
      const status = !!value.statuses && value.statuses[0]
      const contact = !!value.contacts && value.contacts[0]
      const metadata = !!value.metadata && value.metadata

      if (Number(metadata.phone_number_id) !== Number(whatsapp.phoneNumberId)) {
        // ignore webhook if phone number id is different
        return ctx.response.status(200).send({ code: 200 })
      }

      if (['unsupported', 'reaction', 'order', 'system'].includes(message.type)) {
        // i don't support this, you can pull request!
        return ctx.response.status(200).send({ code: 200 })
      }

      let data: WhatsAppMessageContract | WhatsAppStatusContract | null = null

      if (message) {
        const interactive = Helpers.translateInteractive(message)
        const type = Helpers.translateType(interactive?.type || message.type)

        data = {
          from: Number(contact.wa_id),
          sender: contact.profile.name,
          wamid: message.id,
          data: interactive?.data || message[message.type],
          timestamp: Number(message.timestamp),
          type,
        }

        await emitter.emit('wa:message:*', data)
        await emitter.emit(`wa:message:${type}`, data)
      }

      if (status) {
        data = {
          from: Number(status.recipient_id),
          wamid: status.id,
          timestamp: Number(status.timestamp),
          status: status.status,
        }

        await emitter.emit(`wa:status:${status.status}`, data)
        await emitter.emit('wa:status:*', data)
      }

      if (data !== null) {
        await emitter.emit('wa:*', data)
      }
    })
  }

  /**
   * Close all drivers when shutting down the app
   */
  async shutdown() {}
}
