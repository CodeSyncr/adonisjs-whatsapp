import Helpers from '../src/Helpers'
import { WhatsAppCloudApi } from '../src/WhatsAppCloudApi'
import { ApplicationContract } from '@ioc:Adonis/Core/Application'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import {
  WhatsAppConfig,
  WhatsAppMessageContract,
  WhatsAppStatusContract,
} from '@ioc:Adonis/Addons/WhatsApp'
import { ApiProvider } from '../src/types/enum'

interface ConfigProvider {
  apiProvider: string
  accessToken: string
}

export default class WhatsAppProvider {
  public static needsApplication = true

  private config = {}

  constructor(protected app: ApplicationContract) {}

  public register() {
    this.app.container.singleton('Adonis/Addons/WhatsApp', () => {
      const drive = this.app.container.resolveBinding('Adonis/Core/Drive')
      const emitter = this.app.container.resolveBinding('Adonis/Core/Event')
      const database = this.app.container.resolveBinding('Adonis/Lucid/Database')

      const config = this.app.container
        .resolveBinding('Adonis/Core/Config')
        .get('whatsapp', this.config)

      return new WhatsAppCloudApi(config, drive, emitter, database)
    })
  }

  public async boot() {
    const Route = this.app.container.use('Adonis/Core/Route')
    const Event = this.app.container.use('Adonis/Core/Event')
    const Config = this.app.container.use('Adonis/Core/Config')
    const Logger = this.app.container.use('Adonis/Core/Logger')

    const whatsapp: WhatsAppConfig = Config.get('whatsapp', this.config)

    // webhook verifier
    Route.get(
      `${whatsapp.config!.webhookRoute}/:phoneNumberId`,
      async (ctx: HttpContextContract) => {
        const payload = ctx.request.qs()
        const { phoneNumberId } = ctx.request.params()
        let verifyToken: string | undefined | null = null

        if (whatsapp.provider === 'db') {
          verifyToken = await this.getVerifyTokenFromDb(phoneNumberId, whatsapp)
        } else {
          verifyToken = whatsapp.config!.verifyToken
        }

        if (!verifyToken) {
          return ctx.response.status(403).send({ code: 403, message: 'verify token missing' })
        }

        if (!this.isValidWebhook(payload, verifyToken)) {
          return ctx.response.status(403).send({ code: 403 })
        }

        Logger.info('Webhook verified!')
        return ctx.response.status(200).send(payload['hub.challenge'])
      }
    )

    // webhook
    Route.post(
      `${whatsapp.config!.webhookRoute}/:phoneNumberId`,
      async (ctx: HttpContextContract) => {
        const payload = ctx.request.body()
        const { phoneNumberId } = ctx.request.params()

        const config = await this.getConfig(phoneNumberId)
        if (!config) {
          return ctx.response.status(404).send({ code: 403, message: 'Invalid phone id' })
        }

        if (config.apiProvider === ApiProvider.MAG91_API) {
          return await this.handleMag91ApiWebhook(ctx, payload, phoneNumberId, Event)
        } else {
          return await this.handleCloudApiWebhook(ctx, payload, phoneNumberId, Event)
        }
      }
    )
  }

  private async getVerifyTokenFromDb(
    phoneNumberId: string,
    whatsapp: WhatsAppConfig
  ): Promise<string | null> {
    const Database = this.app.container.resolveBinding('Adonis/Lucid/Database')
    const connection = Database.connection(whatsapp.db!.connectionName)
    try {
      const data = await connection
        .from(whatsapp.db!.tableName)
        .select('verify_token')
        .where('phone_number_id', phoneNumberId)
        .first()
      return data?.verify_token || null
    } catch (error) {
      return null
    }
  }

  private isValidWebhook(payload: any, verifyToken: string | null): boolean {
    return payload['hub.mode'] === 'subscribe' && payload['hub.verify_token'] === verifyToken
  }

  private async getConfig(phoneNumberId: string): Promise<ConfigProvider | null> {
    const Config = this.app.container.use('Adonis/Core/Config')
    const whatsapp: WhatsAppConfig = Config.get('whatsapp', this.config)
    if (whatsapp.provider === 'db') {
      const Database = this.app.container.resolveBinding('Adonis/Lucid/Database')
      const connection = Database.connection(whatsapp.db!.connectionName)
      try {
        const data = await connection
          .from(whatsapp.db!.tableName)
          .select('api_provider', 'access_token')
          .where('phone_number_id', phoneNumberId)
          .first()
        return data || null
      } catch (error) {
        return null
      }
    }
    return {
      apiProvider: whatsapp.config!.apiProvider!,
      accessToken: whatsapp.config!.accessToken!,
    }
  }

  private async handleMag91ApiWebhook(
    ctx: HttpContextContract,
    payload: any,
    phoneNumberId: string,
    Event: any
  ) {
    if (!payload || Number(payload.integrated_number) !== Number(phoneNumberId)) {
      return ctx.response.status(200).send({ code: 200 })
    }

    if (['unsupported', 'reaction', 'order', 'system'].includes(payload.content_type)) {
      return ctx.response.status(200).send({ code: 200 })
    }

    const type = Helpers.translateType(payload.content_type)
    const data: WhatsAppMessageContract = {
      from: Number(payload.sender),
      sender: payload.customer_name,
      wamid: payload.message_uuid,
      data: payload[payload.type],
      timestamp: Number(payload.received_at),
      type,
      phoneNumberId,
    }

    await this.emitEvents(Event, 'message', type, data)
    return ctx.response.status(200).send({ code: 200 })
  }

  private async handleCloudApiWebhook(
    ctx: HttpContextContract,
    payload: any,
    phoneNumberId: string,
    Event: any
  ) {
    if (!payload.object) {
      return ctx.response.status(403).send({ code: 403 })
    }

    const { value } = payload.entry[0].changes[0]
    const message = value.messages?.[0]
    const status = value.statuses?.[0]
    const contact = value.contacts?.[0]
    const metadata = value.metadata

    if (Number(metadata.phone_number_id) !== Number(phoneNumberId)) {
      return ctx.response.status(200).send({ code: 200 })
    }

    if (message && !['unsupported', 'reaction', 'order', 'system'].includes(message.type)) {
      const interactive = Helpers.translateInteractive(message)
      const type = Helpers.translateType(interactive?.type || message.type)
      const data: WhatsAppMessageContract = {
        from: Number(contact.wa_id),
        sender: contact.profile.name,
        wamid: message.id,
        data: interactive?.data || message[message.type],
        timestamp: Number(message.timestamp),
        type,
        phoneNumberId,
      }
      await this.emitEvents(Event, 'message', type, data)
    }

    if (status) {
      const data: WhatsAppStatusContract = {
        from: Number(status.recipient_id),
        wamid: status.id,
        timestamp: Number(status.timestamp),
        status: status.status,
        phoneNumberId,
      }
      await this.emitEvents(Event, 'status', status.status, data)
    }

    return ctx.response.status(200).send({ code: 200 })
  }

  private async emitEvents(Event: any, eventType: string, specificType: string, data: any) {
    await Event.emit(`wa:${eventType}:*`, data)
    await Event.emit(`wa:${eventType}:${specificType}`, data)
    await Event.emit('wa:*', data)
  }
}
