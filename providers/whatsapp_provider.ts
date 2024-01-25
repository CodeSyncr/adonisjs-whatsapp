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
import { Emitter } from '@adonisjs/core/events'
import db from '@adonisjs/lucid/services/db'

export default class WhatsAppProvider {
  private config = {}

  constructor(protected app: ApplicationService) {}

  async register() {
    this.app.container.singleton('whatsapp', async () => {
      const { default: Whatsapp } = await import('../src/whatsapp.js')
      const emitter: Emitter<any> = await this.app.container.make('emitter')
      // const drive: any = await this.app.container.make('drive')
      const database = await this.app.container.make('lucid.db')

      const config = this.app.config.get<WhatsAppConfig>('whatsapp', this.config)

      return new Whatsapp(config, emitter, database)
    })
  }

  async boot() {
    const router: any = await this.app.container.make('router')
    const emitter: Emitter<any> = await this.app.container.make('emitter')
    const config: any = await this.app.container.make('config')
    const logger: any = await this.app.container.make('logger')

    const whatsapp: WhatsAppConfig = config.get('whatsapp', this.config)

    // webhook verifier
    router.get(`${whatsapp.config!.webhookRoute}/:phoneNumberId`, async (ctx: HttpContext) => {
      const payload = ctx.request.qs()
      const { phoneNumberId } = ctx.request.params()
      let verifyToken: string | undefined | null = null

      if (whatsapp.provider === 'db') {
        const Database: typeof db = await this.app.container.make('lucid.db')
        const connection = Database.connection(whatsapp.db!.connectionName)
        try {
          const data = await connection
            .from(whatsapp.db!.tableName)
            .select('*')
            .where('phone_number_id', phoneNumberId)
            .first()
          if (data) {
            verifyToken = data.verify_token
          } else {
            return ctx.response.status(404).send({ code: 403, message: 'Invalid phone id' })
          }
        } catch (error) {
          // return ctx.response.status(500).send({ code: 500, message: 'Invalid phone id', error })
        }
      } else {
        verifyToken = whatsapp.config!.verifyToken
      }
      if (!payload['hub.mode'] || !payload['hub.verify_token']) {
        return ctx.response.status(400).send({ code: 400 })
      }

      if (payload['hub.mode'] !== 'subscribe' || payload['hub.verify_token'] !== verifyToken) {
        return ctx.response.status(403).send({ code: 403 })
      }

      logger.info('Webhook verified!')
      return ctx.response.status(200).send(payload['hub.challenge'])
    })

    // webhook
    router.post(`${whatsapp.config!.webhookRoute}/:phoneNumberId`, async (ctx: HttpContext) => {
      const payload = ctx.request.body()
      const { phoneNumberId } = ctx.request.params()

      if (!payload.object) {
        return ctx.response.status(403).send({ code: 403 })
      }

      const { value } = payload.entry[0].changes[0]
      const message = !!value.messages && value.messages[0]
      const status = !!value.statuses && value.statuses[0]
      const contact = !!value.contacts && value.contacts[0]
      const metadata = !!value.metadata && value.metadata

      if (Number(metadata.phone_number_id) !== Number(phoneNumberId)) {
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
          phoneNumberId,
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
          phoneNumberId,
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
