/*
 * @brighthustle/adonisjs-whatsapp
 *
 * (c) Brighthustle
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import axios from 'axios'
import WhatsAppClient from './whats_app_client.js'
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
  WhatsAppResultContract,
  WhatsAppTemplateResultContract,
} from './types/main.js'
import { Emitter } from '@adonisjs/core/events'
import FormData from 'form-data'
import mime from 'mime-types'
import * as fs from 'node:fs'
import Helpers from './helpers.js'

export type WhatsAppResult = {
  messaging_product: 'whatsapp'
  contacts: {
    input: string
    wa_id: string
  }[]
  messages: {
    id: string
  }[]
}

class Whatsapp<WhatsAppConfig> {
  #config: any

  #client: WhatsAppClient

  constructor(
    config: WhatsAppConfig,
    public emitter: Emitter<any>
  ) {
    this.#config = config
    this.#client = new WhatsAppClient(this.#config)
  }

  async sendText(to: number, text: string, options?: TextOptions): Promise<WhatsAppResultContract> {
    return await this.#client.send({
      to,
      type: 'text',
      text: {
        preview_url: options?.preview_url || false,
        body: text,
      },
    })
  }

  async sendImage(
    to: number,
    media: string,
    options?: MediaOptions
  ): Promise<WhatsAppResultContract> {
    return await this.#client.send({
      to,
      type: 'image',
      image: {
        ...(Helpers.isUrl(media) ? { link: media } : { id: media }),
        ...options,
      },
    })
  }

  async sendDocument(
    to: number,
    media: string,
    options?: DocumentOptions
  ): Promise<WhatsAppResultContract> {
    return await this.#client.send({
      to,
      type: 'document',
      document: {
        ...(Helpers.isUrl(media) ? { link: media } : { id: media }),
        ...options,
      },
    })
  }

  async sendAudio(to: number, media: string): Promise<WhatsAppResultContract> {
    return await this.#client.send({
      to,
      type: 'audio',
      audio: {
        ...(Helpers.isUrl(media) ? { link: media } : { id: media }),
      },
    })
  }

  async sendVideo(
    to: number,
    media: string,
    options?: MediaOptions
  ): Promise<WhatsAppResultContract> {
    return await this.#client.send({
      to,
      type: 'video',
      video: {
        ...(Helpers.isUrl(media) ? { link: media } : { id: media }),
        ...options,
      },
    })
  }

  async sendSticker(to: number, media: string): Promise<WhatsAppResultContract> {
    return await this.#client.send({
      to,
      type: 'sticker',
      sticker: {
        ...(Helpers.isUrl(media) ? { link: media } : { id: media }),
      },
    })
  }

  async sendLocation(
    to: number,
    coordinate: CoordinateOptions,
    options?: LocationOptions
  ): Promise<WhatsAppResultContract> {
    return await this.#client.send({
      to,
      type: 'location',
      location: {
        ...coordinate,
        ...options,
      },
    })
  }

  async sendTemplate(
    to: number,
    template: string,
    language: string,
    components?: ComponentOptions[]
  ): Promise<WhatsAppResultContract> {
    return await this.#client.send({
      to,
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

  async sendContact(to: number, contacts: ContactOptions[]): Promise<WhatsAppResultContract> {
    return await this.#client.send({
      to,
      type: 'contacts',
      contacts,
    })
  }

  async sendButtons(
    to: number,
    text: string,
    buttons: ButtonsOptions,
    options?: InteractiveOptions
  ): Promise<WhatsAppResultContract> {
    return await this.#client.send({
      to,
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

  async sendList(
    to: number,
    text: string,
    button: string,
    sections: SectionOptions[],
    options?: InteractiveOptions
  ): Promise<WhatsAppResultContract> {
    return await this.#client.send({
      to,
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

  async markAsRead(wamid: string): Promise<boolean> {
    const response = await this.#client.send(
      {
        status: 'read',
        message_id: wamid,
      },
      false
    )

    return response?.success || false
  }

  on(event: string, handler: (message: any) => void) {
    this.emitter.on(`wa:${event}`, (message) => {
      handler(message)
    })
  }

  async uploadMedia(source: string | any): Promise<string | false> {
    source = typeof source !== 'string' ? (source.tmpPath as string) : source

    const form = new FormData()
    form.append('messaging_product', 'whatsapp')
    form.append('type', mime.contentType(source))
    form.append('file', fs.readFileSync(source), { filename: source })

    const response = await this.#client.upload(form)
    return response.id || false
  }

  async downloadMedia(media: string, options?: DownloadOptions): Promise<string | false> {
    const response = await this.#client.media(media)
    if (!response.url || !response.mime_type) return false

    const ext = mime.extension(response.mime_type)
    const filename = options?.filename || media + (ext ? '.' + ext : '')
    // const filepath = options?.folder ? options.folder + '/' + filename : filename

    const file = await axios({
      method: 'GET',
      url: response.url,
      headers: { Authorization: 'Bearer ' + this.#config.accessToken },
      responseType: 'stream',
    })
    console.log(file)
    // if (options?.disk) {
    //   const disk = this.drive.use(options.disk) as DriveManagerContract
    //   await disk.putStream(filepath, file.data)
    // } else {
    //   await this.drive.putStream(filepath, file.data)
    // }

    return filename
  }

  async createTemplate(
    category: TemplateCategory,
    name: string,
    language: string,
    components: TemplateComponent[]
  ): Promise<WhatsAppTemplateResultContract> {
    return await this.#client.createTemplate({
      category,
      name,
      language,
      components,
    })
  }

  async getTemplates(options?: GetMessageTemplatesQueryParams): Promise<any> {
    return await this.#client.getTemplates(options)
  }

  async deleteTemplate(name: string): Promise<any> {
    return await this.#client.deleteTemplate(name)
  }
}

export default Whatsapp
