import * as fs from 'fs'
import mime from 'mime-types'
import Helpers from './Helpers'
import FormData from 'form-data'
import WhatsAppClient from './WhatsAppClient'
import { EmitterContract } from '@ioc:Adonis/Core/Event'

import { DriveManagerContract } from '@ioc:Adonis/Core/Drive'
import { MultipartFileContract } from '@ioc:Adonis/Core/BodyParser'

import {
  ButtonsOptions,
  ComponentOptions,
  ContactOptions,
  CoordinateOptions,
  DocumentOptions,
  DownloadOptions,
  GetMessageTemplatesQueryParams,
  InteractiveOptions,
  LocationOptions,
  MediaOptions,
  SectionOptions,
  TemplateCategory,
  TemplateComponent,
  TextOptions,
  WhatsAppCloudApiContract,
  WhatsAppConfig,
  WhatsAppResultContract,
  WhatsAppTemplateResultContract,
} from '@ioc:Adonis/Addons/WhatsApp'
import { DatabaseContract } from '@ioc:Adonis/Lucid/Database'

export class WhatsAppCloudApi implements WhatsAppCloudApiContract {
  private client: WhatsAppClient

  constructor(
    private config: WhatsAppConfig,
    private drive: DriveManagerContract,
    private emitter: EmitterContract,
    private db: DatabaseContract
  ) {
    this.client = new WhatsAppClient(this.config, this.db)
  }

  public async sendText(
    to: number,
    text: string,
    options?: TextOptions,
    from?: number
  ): Promise<WhatsAppResultContract> {
    return await this.client.send({
      to,
      from,
      type: 'text',
      text: {
        preview_url: options?.preview_url || false,
        body: text,
      },
    })
  }

  public async sendImage(
    to: number,
    media: string,
    options?: MediaOptions,
    from?: number
  ): Promise<WhatsAppResultContract> {
    return await this.client.send({
      to,
      from,
      type: 'image',
      image: {
        ...(Helpers.isUrl(media) ? { link: media } : { id: media }),
        ...options,
      },
    })
  }

  public async sendDocument(
    to: number,
    media: string,
    options?: DocumentOptions,
    from?: number
  ): Promise<WhatsAppResultContract> {
    return await this.client.send({
      to,
      from,
      type: 'document',
      document: {
        ...(Helpers.isUrl(media) ? { link: media } : { id: media }),
        ...options,
      },
    })
  }

  public async sendAudio(
    to: number,
    media: string,
    from?: number
  ): Promise<WhatsAppResultContract> {
    return await this.client.send({
      to,
      type: 'audio',
      from,
      audio: {
        ...(Helpers.isUrl(media) ? { link: media } : { id: media }),
      },
    })
  }

  public async sendVideo(
    to: number,
    media: string,
    options?: MediaOptions,
    from?: number
  ): Promise<WhatsAppResultContract> {
    return await this.client.send({
      to,
      from,
      type: 'video',
      video: {
        ...(Helpers.isUrl(media) ? { link: media } : { id: media }),
        ...options,
      },
    })
  }

  public async sendSticker(
    to: number,
    media: string,
    from?: number
  ): Promise<WhatsAppResultContract> {
    return await this.client.send({
      to,
      from,
      type: 'sticker',
      sticker: {
        ...(Helpers.isUrl(media) ? { link: media } : { id: media }),
      },
    })
  }

  public async sendLocation(
    to: number,
    coordinate: CoordinateOptions,
    options?: LocationOptions,
    from?: number
  ): Promise<WhatsAppResultContract> {
    return await this.client.send({
      to,
      from,
      type: 'location',
      location: {
        ...coordinate,
        ...options,
      },
    })
  }

  public async sendTemplate(
    to: number,
    template: string,
    language: string,
    components?: ComponentOptions[],
    from?: number
  ): Promise<WhatsAppResultContract> {
    return await this.client.send({
      to,
      from,
      type: 'template',
      template: {
        name: template,
        language: {
          code: language,
        },
        components,
      },
    })
  }

  public async sendContact(
    to: number,
    contacts: ContactOptions[],
    from?: number
  ): Promise<WhatsAppResultContract> {
    return await this.client.send({
      to,
      from,
      type: 'contacts',
      contacts,
    })
  }

  public async sendButtons(
    to: number,
    text: string,
    buttons: ButtonsOptions,
    options?: InteractiveOptions,
    from?: number
  ): Promise<WhatsAppResultContract> {
    return await this.client.send({
      to,
      from,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text },
        ...(options?.footer ? { footer: { text: options?.footer } } : {}),
        header: options?.header,
        action: {
          buttons: Object.keys(buttons).map((key) => {
            return {
              type: 'reply',
              reply: {
                id: key,
                title: buttons[key],
              },
            }
          }),
        },
      },
    })
  }

  public async sendList(
    to: number,
    text: string,
    button: string,
    sections: SectionOptions[],
    options?: InteractiveOptions,
    from?: number
  ): Promise<WhatsAppResultContract> {
    return await this.client.send({
      to,
      from,
      type: 'interactive',
      interactive: {
        type: 'list',
        body: { text },
        ...(options?.footer ? { footer: { text: options?.footer } } : {}),
        header: options?.header,
        action: {
          button,
          sections,
        },
      },
    })
  }

  public async markAsRead(wamid: string): Promise<boolean> {
    const response = await this.client.send(
      {
        status: 'read',
        message_id: wamid,
      },
      false
    )

    return response?.success || false
  }

  public on(event: string, handler: (message: any) => void) {
    this.emitter.on(`wa:${event}`, (message) => {
      handler(message)
    })
  }

  public async uploadMedia(
    source: string | MultipartFileContract,
    from?: number
  ): Promise<string | false> {
    source = typeof source !== 'string' ? (source.tmpPath as string) : source

    const form = new FormData()
    form.append('messaging_product', 'whatsapp')
    form.append('type', mime.contentType(source))
    form.append('file', fs.readFileSync(source), { filename: source })

    const response = await this.client.upload(form, from)
    return response.id || false
  }

  public async downloadMedia(
    media: string,
    options?: DownloadOptions,
    from?: number
  ): Promise<string | false> {
    const response = await this.client.media(media, from)
    if (!response.url || !response.mime_type) return false

    const ext = mime.extension(response.mime_type)
    const filename = options?.filename || media + (ext ? '.' + ext : '')
    const filepath = options?.folder ? options.folder + '/' + filename : filename

    const file = await this.client.download(response.url, from)

    if (options?.disk) {
      const disk = this.drive.use(options.disk) as DriveManagerContract
      await disk.put(filepath, file)
    } else {
      await this.drive.put(filepath, file)
    }

    return filename
  }

  public async createTemplate(
    category: TemplateCategory,
    name: string,
    language: string,
    components: TemplateComponent[],
    from?: number
  ): Promise<WhatsAppTemplateResultContract> {
    return await this.client.createTemplate({
      category,
      name,
      language,
      components,
      from,
    })
  }

  public async getTemplates(options?: GetMessageTemplatesQueryParams, from?: number): Promise<any> {
    return await this.client.getTemplates(options, from)
  }

  public async deleteTemplate(name: string, from?: number): Promise<any> {
    return await this.client.deleteTemplate(name, from)
  }
}
