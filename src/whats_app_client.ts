/*
 * @brighthustle/adonisjs-whatsapp
 *
 * (c) Brighthustle
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import axios from 'axios'
import FormData from 'form-data'
import {
  GetMessageTemplatesQueryParams,
  WhatsAppConfig,
  WhatsAppResultContract,
} from './types/main.js'

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
  #config: WhatsAppConfig
  #headers: any
  #mandatory: any
  constructor(config: WhatsAppConfig) {
    this.#config = config
    this.#headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + this.#config.accessToken,
    }
    this.#mandatory = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
    }
  }

  async send(data: Record<string, any>, parse = true) {
    const { timeout, phoneNumberId, graphUrl, graphVersion } = this.#config

    const response = await axios({
      validateStatus: (status) => status <= 999,
      method: 'POST',
      url: `${graphUrl}/${graphVersion}/${phoneNumberId}/messages`,
      timeout,
      headers: this.#headers,
      data: { ...this.#mandatory, ...data },
      responseType: 'json',
    })

    if ('error' in response.data) {
      throw new Error(response.data.error?.error_data?.details || response.data.error?.message)
    }

    return parse ? WhatsAppClient.#parse(response.data) : response.data
  }

  async media(media: string) {
    const { timeout, graphUrl, graphVersion } = this.#config

    const response = await axios({
      validateStatus: (status) => status <= 999,
      method: 'GET',
      url: `${graphUrl}/${graphVersion}/${media}`,
      timeout,
      headers: this.#headers,
      responseType: 'json',
    })

    if ('error' in response.data) {
      throw new Error(response.data.error?.error_data?.details || response.data.error?.message)
    }

    return response.data
  }

  async upload(form: FormData) {
    const { timeout, phoneNumberId, graphUrl, graphVersion } = this.#config

    const response = await axios({
      validateStatus: (status) => status <= 999,
      method: 'POST',
      url: `${graphUrl}/${graphVersion}/${phoneNumberId}/media`,
      timeout,
      headers: { ...form.getHeaders(), ...this.#headers },
      data: form,
      responseType: 'json',
    })

    if ('error' in response.data) {
      throw new Error(response.data.error?.error_data?.details || response.data.error?.message)
    }

    return response.data
  }

  async createTemplate(data: Record<string, any>) {
    const { timeout, whatsappBusinessId, graphUrl, graphVersion } = this.#config

    const response = await axios({
      validateStatus: (status) => status <= 999,
      method: 'POST',
      url: `${graphUrl}/${graphVersion}/${whatsappBusinessId}/message_templates`,
      timeout,
      headers: this.#headers,
      data: data,
      responseType: 'json',
    })

    if ('error' in response.data) {
      throw new Error(response.data.error?.error_data?.details || response.data.error?.message)
    }

    return response.data
  }

  async getTemplates(options?: GetMessageTemplatesQueryParams) {
    const { timeout, whatsappBusinessId, graphUrl, graphVersion } = this.#config
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
      headers: this.#headers,
      responseType: 'json',
    })

    if ('error' in response.data) {
      throw new Error(response.data.error?.error_data?.details || response.data.error?.message)
    }

    return response.data
  }

  async deleteTemplate(name: string): Promise<any> {
    const { timeout, graphUrl, graphVersion, whatsappBusinessId } = this.#config

    const response = await axios({
      validateStatus: (status) => status <= 999,
      method: 'DELETE',
      url: `${graphUrl}/${graphVersion}/${whatsappBusinessId}/message_templates?name=${name}`,
      timeout,
      headers: this.#headers,
      responseType: 'json',
    })

    if ('error' in response.data) {
      throw new Error(response.data.error?.error_data?.details || response.data.error?.message)
    }

    return response.data
  }

  static #parse(data: WhatsAppResult): WhatsAppResultContract {
    return {
      input: Number(data.contacts[0].input),
      phone: data.contacts[0].wa_id,
      wamid: data.messages[0].id,
    }
  }
}
