/*
 * @adonisjs/whatsapp
 *
 * (c) AdonisJS
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */
export type TextOptions = {
  preview_url?: boolean
}

export type TemplateCategory = 'AUTHENTICATION' | 'MARKETING' | 'UTILITY'

export type ComponentType = 'BODY' | 'HEADER' | 'FOOTER' | 'BUTTON' | 'URL'
export type ComponentButtonType = 'PHONE_NUMBER' | 'URL' | 'QUICK_REPLY'

export type ComponentFormat = 'TEXT' | 'IMAGE' | 'LOCATION' | 'VIDEO' | 'DOCUMENT'

export type ExampleHeader = {
  header_text?: string[]
  header_handle?: string[]
}

export type ExampleBody = {
  body_text: [string[]] // Define actual type
}

export type ExampleButton = {
  type: ComponentButtonType
  text: string
  phone_number?: string
  url?: string
}

export type ExampleURL = string[]

export type TemplateComponent =
  | {
      type: ComponentType
      format: ComponentFormat
      text: string
      example: ExampleHeader
    }
  | {
      type: ComponentType
      text: string
      example: ExampleBody[]
    }
  | {
      type: ComponentType
      text: string
    }
  | {
      type: ComponentType
      buttons: ExampleButton[]
    }
  | {
      type: ComponentType
      text: string
      url: string
      example: ExampleURL
    }

export enum TemplateFields {
  ID = 'id',
  CATEGORY = 'category',
  COMPONENTS = 'components',
  LANGUAGE = 'language',
  MESSAGE_SEND_TTL_SECONDS = 'message_send_ttl_seconds',
  NAME = 'name',
  PREVIOUS_CATEGORY = 'previous_category',
  QUALITY_SCORE = 'quality_score',
  REJECTED_REASON = 'rejected_reason',
  STATUS = 'status',
}

export type TemplateFieldsArray = (keyof typeof TemplateFields)[]

export type GetMessageTemplatesQueryParams = {
  fields?: TemplateFieldsArray
  limit?: number
}

export type MediaOptions = {
  caption?: string
}

export type DocumentOptions = {
  caption?: string
  filename?: string
}

export type CoordinateOptions = {
  latitude: string
  longitude: string
}

export type LocationOptions = {
  name?: string
  address?: string
}

export type CurrencyObject = {
  fallback_value: string
  code: string
  amount_1000: number
}

export type DateTimeObject = {
  fallback_value: string
}

export type MediaObject = {
  id?: string
  link?: string
} & DocumentOptions & {
    provider?: string
  }

export type ParameterObject = {
  type: 'currency' | 'date_time' | 'document' | 'image' | 'text' | 'video' | 'payload'
  payload?: string
  text?: string
  currency?: CurrencyObject
  date_time?: DateTimeObject
  image?: MediaObject
  document?: MediaObject
  video?: MediaObject
}

export type ComponentOptions = {
  type: 'header' | 'body' | 'footer' | 'button'
  sub_type?: 'quick_reply' | 'url'
  index?: string
  parameters: ParameterObject[]
}

export type AddressObject = {
  street?: string
  city?: string
  state?: string
  zip?: string
  country?: string
  country_code?: string
  type?: 'HOME' | 'WORK'
}

export type EmailObject = {
  email?: string
  type?: 'HOME' | 'WORK'
}

export type PhoneObject = {
  phone?: string
  type?: 'CELL' | 'MAIN' | 'IPHONE' | 'HOME' | 'WORK'
  wa_id?: string
}

export type UrlObject = {
  url?: string
  type?: 'HOME' | 'WORK'
}

export type ContactOptions = {
  addresses?: AddressObject[]
  birthday?: string
  emails?: EmailObject[]
  name: {
    formatted_name: string
    first_name: string
    last_name?: string
    middle_name?: string
    suffix?: string
    prefix?: string
  }
  org?: {
    company?: string
    department?: string
    title?: string
  }
  phones?: PhoneObject[]
  urls?: UrlObject[]
}

export type ButtonsOptions = {
  [index: string]: string
}

export type InteractiveOptions = {
  footer?: string
  header?: {
    type: 'text' | 'video' | 'image' | 'document'
    text?: string
    video?: MediaObject
    image?: MediaObject
    document?: MediaObject
  }
}

export type RowObject = {
  id: string
  title: string
  description?: string
}

export type SectionOptions = {
  title?: string
  rows: RowObject[]
}

export type DownloadOptions = {
  filename?: string
  disk?: keyof any
  folder?: string
}

export type WhatsAppMessageContract = {
  from: number
  sender: string
  wamid: string
  data: Record<string, any>
  timestamp: number
  type:
    | 'text'
    | 'image'
    | 'document'
    | 'audio'
    | 'video'
    | 'sticker'
    | 'location'
    | 'contacts'
    | 'button'
    | 'list'
}

export type WhatsAppStatusContract = {
  from: number
  wamid: string
  timestamp: number
  status: 'sent' | 'delivered' | 'read'
}

export interface WhatsAppResultContract {
  input: number
  phone: string
  wamid: string
}

export interface WhatsAppTemplateResultContract {
  id: number
  status: string
  category: string
}

export interface WhatsAppCloudApiService {
  sendText(to: number, text: string, options?: TextOptions): Promise<WhatsAppResultContract>

  sendImage(to: number, media: string, options?: MediaOptions): Promise<WhatsAppResultContract>

  sendDocument(
    to: number,
    media: string,
    options?: DocumentOptions
  ): Promise<WhatsAppResultContract>

  sendAudio(to: number, media: string): Promise<WhatsAppResultContract>

  sendVideo(to: number, media: string, options?: MediaOptions): Promise<WhatsAppResultContract>

  sendSticker(to: number, media: string): Promise<WhatsAppResultContract>

  sendLocation(
    to: number,
    coordinate: CoordinateOptions,
    options?: LocationOptions
  ): Promise<WhatsAppResultContract>

  sendTemplate(
    to: number,
    template: string,
    language: string,
    components: ComponentOptions[]
  ): Promise<WhatsAppResultContract>

  sendContact(to: number, contacts: ContactOptions[]): Promise<WhatsAppResultContract>

  sendButtons(
    to: number,
    text: string,
    buttons: ButtonsOptions,
    options?: InteractiveOptions
  ): Promise<WhatsAppResultContract>

  sendList(
    to: number,
    text: string,
    button: string,
    sections: SectionOptions[],
    options?: InteractiveOptions
  ): Promise<WhatsAppResultContract>

  markAsRead(wamid: string): Promise<boolean>

  on(
    event:
      | 'message:text'
      | 'message:image'
      | 'message:document'
      | 'message:audio'
      | 'message:video'
      | 'message:sticker'
      | 'message:location'
      | 'message:contacts'
      | 'message:button'
      | 'message:list'
      | 'message:*',
    handler: (message: WhatsAppMessageContract) => void
  ): void

  on(
    event: 'status:sent' | 'status:delivered' | 'status:read' | 'status:*',
    handler: (message: WhatsAppStatusContract) => void
  ): void

  on(event: '*', handler: (message: WhatsAppMessageContract | WhatsAppStatusContract) => void): void

  downloadMedia(media: string, options?: DownloadOptions): Promise<string | false>

  uploadMedia(source: string | any): Promise<string | false>

  createTemplate(
    category: TemplateCategory,
    name: string,
    language: string,
    components: TemplateComponent[]
  ): Promise<WhatsAppTemplateResultContract>

  getTemplates(options?: GetMessageTemplatesQueryParams): Promise<any>

  deleteTemplate(name: string): Promise<any>
}

export interface WhatsAppConfig {
  webhookRoute: string
  timeout: number
  phoneNumberId: string
  whatsappBusinessId: string
  accessToken: string
  verifyToken: string
  graphUrl: string
  graphVersion: string
}
