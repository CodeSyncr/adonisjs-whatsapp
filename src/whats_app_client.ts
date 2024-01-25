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
import { QueryClientContract } from '@adonisjs/lucid/types/database'
import Database from '@adonisjs/lucid/services/db'

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
  #connection?: string | QueryClientContract

  constructor(
    config: WhatsAppConfig,
    private db: typeof Database
  ) {
    this.#config = config
    this.#headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + this.#config.config.accessToken,
    }
    this.#mandatory = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
    }
  }

  async #getWhatsappConfig(from: number): Promise<any> {
    if (!this.#connection) {
      this.db.connection(this.#config.db!.connectionName)
    }

    const waResponse = await this.db
      .query()
      .select('*')
      .from(this.#config.db!.tableName)
      .where('id', from)
      .first()
    return waResponse
  }

  async send(data: Record<string, any>, parse = true) {
    let { timeout, phoneNumberId, graphUrl, graphVersion } = this.#config.config
    let dbHeaders: any = null
    if (this.#config.db) {
      if (!data.from) {
        throw new Error('From (id for whatsapp db) is required as db config is enabled.')
      }
      const waResponse = await this.#getWhatsappConfig(data.from)
      if (waResponse) {
        phoneNumberId = waResponse.phone_number_id
        graphVersion = waResponse.graph_version ?? graphVersion
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
      headers: dbHeaders ?? this.#headers,
      data: { ...this.#mandatory, ...data },
      responseType: 'json',
    })

    if ('error' in response.data) {
      throw new Error(response.data.error?.error_data?.details || response.data.error?.message)
    }

    return parse ? WhatsAppClient.#parse(response.data) : response.data
  }

  async media(media: string, from?: number) {
    let { timeout, graphUrl, graphVersion } = this.#config.config
    let dbHeaders: any = null
    if (this.#config.db) {
      if (!from) {
        throw new Error('From (id for whatsapp db) is required as db config is enabled.')
      }
      const waResponse = await this.#getWhatsappConfig(from)
      if (waResponse) {
        graphVersion = waResponse.graph_version ?? graphVersion
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
      method: 'GET',
      url: `${graphUrl}/${graphVersion}/${media}`,
      timeout,
      headers: dbHeaders ?? this.#headers,
      responseType: 'json',
    })

    if ('error' in response.data) {
      throw new Error(response.data.error?.error_data?.details || response.data.error?.message)
    }

    return response.data
  }

  async upload(form: FormData, from?: number) {
    let { timeout, phoneNumberId, graphUrl, graphVersion } = this.#config.config
    let dbHeaders: any = null
    if (this.#config.db) {
      if (!from) {
        throw new Error('From (id for whatsapp db) is required as db config is enabled.')
      }
      const waResponse = await this.#getWhatsappConfig(from)
      if (waResponse) {
        phoneNumberId = waResponse.phone_number_id
        graphVersion = waResponse.graph_version ?? graphVersion
        dbHeaders = {
          ...form.getHeaders(),
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
      url: `${graphUrl}/${graphVersion}/${phoneNumberId}/media`,
      timeout,
      headers: dbHeaders ?? { ...form.getHeaders(), ...this.#headers },
      data: form,
      responseType: 'json',
    })

    if ('error' in response.data) {
      throw new Error(response.data.error?.error_data?.details || response.data.error?.message)
    }

    return response.data
  }

  async createTemplate(data: Record<string, any>) {
    let { timeout, whatsappBusinessId, graphUrl, graphVersion } = this.#config.config
    let dbHeaders: any = null
    if (this.#config.db) {
      if (!data.from) {
        throw new Error('From (id for whatsapp db) is required as db config is enabled.')
      }
      const waResponse = await this.#getWhatsappConfig(data.from)
      if (waResponse) {
        whatsappBusinessId = waResponse.whatsapp_business_id
        graphVersion = waResponse.graph_version ?? graphVersion
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
      url: `${graphUrl}/${graphVersion}/${whatsappBusinessId}/message_templates`,
      timeout,
      headers: dbHeaders ?? this.#headers,
      data: data,
      responseType: 'json',
    })

    if ('error' in response.data) {
      throw new Error(response.data.error?.error_data?.details || response.data.error?.message)
    }

    return response.data
  }

  async getTemplates(options?: GetMessageTemplatesQueryParams, from?: number) {
    let { timeout, whatsappBusinessId, graphUrl, graphVersion } = this.#config.config
    let dbHeaders: any = null
    if (this.#config.db) {
      if (!from) {
        throw new Error('From (id for whatsapp db) is required as db config is enabled.')
      }
      const waResponse = await this.#getWhatsappConfig(from)
      if (waResponse) {
        whatsappBusinessId = waResponse.whatsapp_business_id
        graphVersion = waResponse.graph_version ?? graphVersion
        dbHeaders = {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + waResponse.access_token,
        }
      } else {
        throw new Error('Incorrect Phone Number ID')
      }
    }
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
      headers: dbHeaders ?? this.#headers,
      responseType: 'json',
    })

    if ('error' in response.data) {
      throw new Error(response.data.error?.error_data?.details || response.data.error?.message)
    }

    return response.data
  }

  async deleteTemplate(name: string, from?: number): Promise<any> {
    let { timeout, graphUrl, graphVersion, whatsappBusinessId } = this.#config.config
    let dbHeaders: any = null
    if (this.#config.db) {
      if (!from) {
        throw new Error('From (id for whatsapp db) is required as db config is enabled.')
      }
      const waResponse = await this.#getWhatsappConfig(from)
      if (waResponse) {
        whatsappBusinessId = waResponse.whatsapp_business_id
        graphVersion = waResponse.graph_version ?? graphVersion
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
      method: 'DELETE',
      url: `${graphUrl}/${graphVersion}/${whatsappBusinessId}/message_templates?name=${name}`,
      timeout,
      headers: dbHeaders ?? this.#headers,
      responseType: 'json',
    })

    if ('error' in response.data) {
      throw new Error(response.data.error?.error_data?.details || response.data.error?.message)
    }

    return response.data
  }

  async download(url: string, from?: number): Promise<any> {
    let dbHeaders: any = null

    if (this.#config.db) {
      if (!from) {
        throw new Error('From (id for whatsapp db) is required as db config is enabled.')
      }

      const waResponse = await this.#getWhatsappConfig(from)
      if (waResponse) {
        dbHeaders = {
          Authorization: 'Bearer ' + waResponse.access_token,
        }
      } else {
        throw new Error('Incorrect Phone Number ID')
      }
    }

    const response = await axios({
      validateStatus: (status) => status <= 999,
      method: 'GET',
      url: url,
      headers: dbHeaders ?? { Authorization: 'Bearer ' + this.#config.config!.accessToken },
      responseType: 'arraybuffer',
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
