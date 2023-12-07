import axios from 'axios'
import FormData from 'form-data'
import {
  GetMessageTemplatesQueryParams,
  WhatsAppConfig,
  WhatsAppResultContract,
} from '@ioc:Adonis/Addons/WhatsApp'
import Database from '@ioc:Adonis/Lucid/Database'

type WhatsAppResult = {
  messaging_product: 'whatsapp'
  contacts: {
    input: string
    wa_id: string
  }[]
  messages: {
    id: string
  }[]
}

export default class WhatsAppClient {
  constructor(private config: WhatsAppConfig) {}

  private headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + this.config.config!.accessToken,
  }

  private mandatory = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
  }

  public async send(data: Record<string, any>, parse = true) {
    let { timeout, phoneNumberId, graphUrl, graphVersion } = this.config.config!
    let dbHeaders: any = null
    if (this.config.db) {
      if (!data.from) {
        throw new Error('From (id for whatsapp db) is required as db config is enabled.')
      }
      const waResponse = await Database.query()
        .select('*')
        .from(this.config.db!.tableName)
        .where('id', data.from)
        .first()
      if (waResponse) {
        phoneNumberId = waResponse.phone_number_id
        graphVersion = waResponse.graph_version
        dbHeaders = {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + waResponse.access_token,
        }
      } else {
        throw new Error('Incorrect Phone Number ID')
      }
    }

    const response = await axios({
      validateStatus: (status) => status <= 999,
      method: 'POST',
      url: `${graphUrl}/${graphVersion}/${phoneNumberId}/messages`,
      timeout,
      headers: dbHeaders ?? this.headers,
      data: { ...this.mandatory, ...data },
      responseType: 'json',
    })

    if ('error' in response.data) {
      throw new Error(response.data.error?.error_data?.details || response.data.error?.message)
    }

    return parse ? WhatsAppClient.parse(response.data) : response.data
  }

  public async media(media: string) {
    const { timeout, graphUrl, graphVersion } = this.config.config!

    const response = await axios({
      validateStatus: (status) => status <= 999,
      method: 'GET',
      url: `${graphUrl}/${graphVersion}/${media}`,
      timeout,
      headers: this.headers,
      responseType: 'json',
    })

    if ('error' in response.data) {
      throw new Error(response.data.error?.error_data?.details || response.data.error?.message)
    }

    return response.data
  }

  public async upload(form: FormData) {
    const { timeout, phoneNumberId, graphUrl, graphVersion } = this.config.config!

    const response = await axios({
      validateStatus: (status) => status <= 999,
      method: 'POST',
      url: `${graphUrl}/${graphVersion}/${phoneNumberId}/media`,
      timeout,
      headers: { ...form.getHeaders(), ...this.headers },
      data: form,
      responseType: 'json',
    })

    if ('error' in response.data) {
      throw new Error(response.data.error?.error_data?.details || response.data.error?.message)
    }

    return response.data
  }

  public async createTemplate(data: Record<string, any>) {
    const { timeout, whatsappBusinessId, graphUrl, graphVersion } = this.config.config!

    const response = await axios({
      validateStatus: (status) => status <= 999,
      method: 'POST',
      url: `${graphUrl}/${graphVersion}/${whatsappBusinessId}/message_templates`,
      timeout,
      headers: this.headers,
      data: data,
      responseType: 'json',
    })

    if ('error' in response.data) {
      throw new Error(response.data.error?.error_data?.details || response.data.error?.message)
    }

    return response.data
  }

  public async getTemplates(options?: GetMessageTemplatesQueryParams) {
    const { timeout, whatsappBusinessId, graphUrl, graphVersion } = this.config.config!
    let qs = ''

    if (options) {
      if (options.fields && options.fields.length > 0) {
        qs += qs.length > 0 ? '&' : '?'
        qs += `fields=${options.fields.join(',')}`
      }

      if (options.limit) {
        qs += qs.length > 0 ? '&' : '?'
        qs += `limit=${options.limit}`
      }
    }
    const response = await axios({
      validateStatus: (status) => status <= 999,
      method: 'GET',
      url: `${graphUrl}/${graphVersion}/${whatsappBusinessId}/message_templates${qs}`,
      timeout,
      headers: this.headers,
      responseType: 'json',
    })

    if ('error' in response.data) {
      throw new Error(response.data.error?.error_data?.details || response.data.error?.message)
    }

    return response.data
  }

  public async deleteTemplate(name: string): Promise<any> {
    const { timeout, graphUrl, graphVersion, whatsappBusinessId } = this.config.config!

    const response = await axios({
      validateStatus: (status) => status <= 999,
      method: 'DELETE',
      url: `${graphUrl}/${graphVersion}/${whatsappBusinessId}/message_templates?name=${name}`,
      timeout,
      headers: this.headers,
      responseType: 'json',
    })

    if ('error' in response.data) {
      throw new Error(response.data.error?.error_data?.details || response.data.error?.message)
    }

    return response.data
  }

  private static parse(data: WhatsAppResult): WhatsAppResultContract {
    return {
      input: Number(data.contacts[0].input),
      phone: data.contacts[0].wa_id,
      wamid: data.messages[0].id,
    }
  }
}
