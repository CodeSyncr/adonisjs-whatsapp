import axios from 'axios'
import FormData from 'form-data'
import {
  GetMessageTemplatesQueryParams,
  WhatsAppConfig,
  WhatsAppResultContract,
} from '@ioc:Adonis/Addons/WhatsApp'
import { DatabaseContract, QueryClientContract } from '@ioc:Adonis/Lucid/Database'

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
  /**
   * Custom connection or query client
   */
  private connection?: string | QueryClientContract

  constructor(private config: WhatsAppConfig, private db: DatabaseContract) {}

  private headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + this.config.config?.accessToken,
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

      if (!this.connection) {
        this.db.connection(this.config.db.connectionName)
      }

      const waResponse = await this.db
        .query()
        .select('*')
        .from(this.config.db!.tableName)
        .where('id', data.from)
        .first()
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
      headers: dbHeaders ?? this.headers,
      data: { ...this.mandatory, ...data },
      responseType: 'json',
    })

    if ('error' in response.data) {
      throw new Error(response.data.error?.error_data?.details || response.data.error?.message)
    }

    return parse ? WhatsAppClient.parse(response.data) : response.data
  }

  public async media(media: string, from?: number) {
    let { timeout, graphUrl, graphVersion } = this.config.config!
    let dbHeaders: any = null
    if (this.config.db) {
      if (!from) {
        throw new Error('From (id for whatsapp db) is required as db config is enabled.')
      }

      if (!this.connection) {
        this.db.connection(this.config.db.connectionName)
      }

      const waResponse = await this.db
        .query()
        .select('*')
        .from(this.config.db!.tableName)
        .where('id', from)
        .first()
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
      headers: dbHeaders ?? this.headers,
      responseType: 'json',
    })

    if ('error' in response.data) {
      throw new Error(response.data.error?.error_data?.details || response.data.error?.message)
    }

    return response.data
  }

  public async upload(form: FormData, from?: number) {
    let { timeout, phoneNumberId, graphUrl, graphVersion } = this.config.config!
    let dbHeaders: any = null

    if (this.config.db) {
      if (!from) {
        throw new Error('From (id for whatsapp db) is required as db config is enabled.')
      }

      if (!this.connection) {
        this.db.connection(this.config.db.connectionName)
      }

      const waResponse = await this.db
        .query()
        .select('*')
        .from(this.config.db!.tableName)
        .where('id', from)
        .first()
      if (waResponse) {
        graphVersion = waResponse.graph_version ?? graphVersion
        phoneNumberId = waResponse.phone_number_id
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
      headers: dbHeaders ?? { ...form.getHeaders(), ...this.headers },
      data: form,
      responseType: 'json',
    })

    if ('error' in response.data) {
      throw new Error(response.data.error?.error_data?.details || response.data.error?.message)
    }

    return response.data
  }

  public async createTemplate(data: Record<string, any>) {
    let { timeout, whatsappBusinessId, graphUrl, graphVersion } = this.config.config!
    let dbHeaders: any = null

    if (this.config.db) {
      if (!data.from) {
        throw new Error('From (id for whatsapp db) is required as db config is enabled.')
      }

      if (!this.connection) {
        this.db.connection(this.config.db.connectionName)
      }

      const waResponse = await this.db
        .query()
        .select('*')
        .from(this.config.db!.tableName)
        .where('id', data.from)
        .first()
      if (waResponse) {
        graphVersion = waResponse.graph_version ?? graphVersion
        whatsappBusinessId = waResponse.whatsapp_business_id
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
      headers: dbHeaders ?? this.headers,
      data: data,
      responseType: 'json',
    })

    if ('error' in response.data) {
      throw new Error(response.data.error?.error_data?.details || response.data.error?.message)
    }

    return response.data
  }

  public async getTemplates(options?: GetMessageTemplatesQueryParams, from?: number) {
    let { timeout, whatsappBusinessId, graphUrl, graphVersion } = this.config.config!
    let dbHeaders: any = null

    if (this.config.db) {
      if (!from) {
        throw new Error('From (id for whatsapp db) is required as db config is enabled.')
      }

      if (!this.connection) {
        this.db.connection(this.config.db.connectionName)
      }

      const waResponse = await this.db
        .query()
        .select('*')
        .from(this.config.db!.tableName)
        .where('id', from)
        .first()
      if (waResponse) {
        graphVersion = waResponse.graph_version ?? graphVersion
        whatsappBusinessId = waResponse.whatsapp_business_id
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
      headers: dbHeaders ?? this.headers,
      responseType: 'json',
    })

    if ('error' in response.data) {
      throw new Error(response.data.error?.error_data?.details || response.data.error?.message)
    }

    return response.data
  }

  public async deleteTemplate(name: string, from?: number): Promise<any> {
    let { timeout, graphUrl, graphVersion, whatsappBusinessId } = this.config.config!
    let dbHeaders: any = null

    if (this.config.db) {
      if (!from) {
        throw new Error('From (id for whatsapp db) is required as db config is enabled.')
      }

      if (!this.connection) {
        this.db.connection(this.config.db.connectionName)
      }

      const waResponse = await this.db
        .query()
        .select('*')
        .from(this.config.db!.tableName)
        .where('id', from)
        .first()
      if (waResponse) {
        graphVersion = waResponse.graph_version ?? graphVersion
        whatsappBusinessId = waResponse.whatsapp_business_id
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
      headers: dbHeaders ?? this.headers,
      responseType: 'json',
    })

    if ('error' in response.data) {
      throw new Error(response.data.error?.error_data?.details || response.data.error?.message)
    }

    return response.data
  }

  public async download(url: string, from?: number): Promise<any> {
    let dbHeaders: any = null

    if (this.config.db) {
      if (!from) {
        throw new Error('From (id for whatsapp db) is required as db config is enabled.')
      }

      if (!this.connection) {
        this.db.connection(this.config.db.connectionName)
      }

      const waResponse = await this.db
        .query()
        .select('*')
        .from(this.config.db!.tableName)
        .where('id', from)
        .first()
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
      headers: dbHeaders ?? { Authorization: 'Bearer ' + this.config.config!.accessToken },
      responseType: 'arraybuffer',
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
