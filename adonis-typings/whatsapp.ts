declare module '@ioc:Adonis/Addons/WhatsApp' {
  import { DisksList } from '@ioc:Adonis/Core/Drive'
  import { MultipartFileContract } from '@ioc:Adonis/Core/BodyParser'

  export type TextOptions = {
    preview_url?: boolean
  }

  export type TemplateCategory = 'AUTHENTICATION' | 'MARKETING' | 'UTILITY'

  type ComponentType = 'BODY' | 'HEADER' | 'FOOTER' | 'BUTTON' | 'URL'
  type ComponentButtonType = 'PHONE_NUMBER' | 'URL' | 'QUICK_REPLY'

  type ComponentFormat = 'TEXT' | 'IMAGE' | 'LOCATION' | 'VIDEO' | 'DOCUMENT'

  type ExampleHeader = {
    header_text?: string[]
    header_handle?: string[]
  }

  type ExampleBody = {
    body_text: [string[]] // Define actual type
  }

  type ExampleButton = {
    type: ComponentButtonType
    text: string
    phone_number?: string
    url?: string
  }

  type ExampleURL = string[]

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

  enum TemplateFields {
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

  type TemplateFieldsArray = (keyof typeof TemplateFields)[]

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

  type CurrencyObject = {
    fallback_value: string
    code: string
    amount_1000: number
  }

  type DateTimeObject = {
    fallback_value: string
  }

  type MediaObject = {
    id?: string
    link?: string
  } & DocumentOptions & {
      provider?: string
    }

  type ParameterObject = {
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

  type AddressObject = {
    street?: string
    city?: string
    state?: string
    zip?: string
    country?: string
    country_code?: string
    type?: 'HOME' | 'WORK'
  }

  type EmailObject = {
    email?: string
    type?: 'HOME' | 'WORK'
  }

  type PhoneObject = {
    phone?: string
    type?: 'CELL' | 'MAIN' | 'IPHONE' | 'HOME' | 'WORK'
    wa_id?: string
  }

  type UrlObject = {
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

  type RowObject = {
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
    disk?: keyof DisksList
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

  export interface WhatsAppCloudApiContract {
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
        | `wa:message:text:${string}`
        | `wa:message:image:${string}`
        | `wa:message:document:${string}`
        | `wa:message:audio:${string}`
        | `wa:message:video:${string}`
        | `wa:message:sticker:${string}`
        | `wa:message:location:${string}`
        | `wa:message:contacts:${string}`
        | `wa:message:button:${string}`
        | `wa:message:list:${string}`
        | `wa:message:*:${string}`,
      handler: (message: WhatsAppMessageContract) => void
    ): void

    on(
      event: 'status:sent' | 'status:delivered' | 'status:read' | 'status:*',
      handler: (message: WhatsAppStatusContract) => void
    ): void

    on(
      event: '*',
      handler: (message: WhatsAppMessageContract | WhatsAppStatusContract) => void
    ): void

    downloadMedia(media: string, options?: DownloadOptions): Promise<string | false>

    uploadMedia(source: string | MultipartFileContract): Promise<string | false>

    createTemplate(
      category: TemplateCategory,
      name: string,
      language: string,
      components: TemplateComponent[]
    ): Promise<WhatsAppTemplateResultContract>

    getTemplates(options?: GetMessageTemplatesQueryParams): Promise<any>

    deleteTemplate(name: string): Promise<any>
  }

  export interface WhatsAppDataConfig {
    webhookRoute: string
    timeout: number
    phoneNumberId?: string
    whatsappBusinessId?: string
    accessToken?: string
    verifyToken?: string
    graphUrl: string
    graphVersion: string
  }

  export interface WhatsAppDatabaseConfig {
    dbName: string
    tableName: string
    connectionName: string
  }

  /**
   * Shape of database provider user builder. It must always returns [[ProviderUserContract]]
   */
  export interface WhatsAppConfig {
    provider: string
    config: WhatsAppDataConfig
    db?: WhatsAppDatabaseConfig
  }

  const WhatsApp: WhatsAppCloudApiContract
  export default WhatsApp
}
