import axios from 'axios'
import FormData from 'form-data'
import {
  GetMessageTemplatesQueryParams,
  WhatsAppConfig,
  WhatsAppResultContract,
} from '@ioc:Adonis/Addons/WhatsApp'
import { DatabaseContract, QueryClientContract } from '@ioc:Adonis/Lucid/Database'
import Helpers from './Helpers'
import { ApiProvider } from './types/enum'

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

type Msg91Result = {
  messaging_product: 'msg91'
  status: string
  data: string
  errors: any
  request_id: string
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
    let headers: any = this.headers
    let apiProvider: string | undefined | null = null
    let url: string = `${graphUrl}/${graphVersion}/${phoneNumberId}/messages`

    if (!this.config.db) {
      this.validateApiProvider(this.config.config.apiProvider)
      apiProvider = this.config.config.apiProvider
      headers = this.getHeaders(apiProvider!, this.config.config.accessToken)
    }
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
        apiProvider = waResponse.api_provider
        graphVersion = waResponse.graph_version ?? graphVersion
        headers = this.getHeaders(apiProvider!, waResponse.access_token)
      } else {
        throw new Error('Incorrect Phone Number ID')
      }
    }

    if (apiProvider === ApiProvider.MAG91_API) {
      if (data.type === 'text') {
        url = `${graphUrl}/${graphVersion}/whatsapp/whatsapp-outbound-message/?integrated_number=${phoneNumberId!}&recipient_number=${
          data.to
        }&content_type=text&text=${data.text.body}`
      } else if (data.type === 'template') {
        data = Helpers.transformToMsg91SendTemplate(
          phoneNumberId!,
          data.template.name,
          data.template.language.code,
          data.template.components,
          data.to
        )
        url = `${graphUrl}/${graphVersion}/whatsapp/whatsapp-outbound-message/bulk/`
      } else {
        throw new Error('Not implemented in msg 91 apis')
      }
    } else {
      data = { ...this.mandatory, ...data }
    }

    const response = await axios({
      validateStatus: (status) => status <= 999,
      method: 'POST',
      url: url,
      timeout,
      headers: headers,
      data: data,
      responseType: 'json',
    })

    if ('error' in response.data) {
      throw new Error(response.data.error?.error_data?.details || response.data.error?.message)
    }

    return parse
      ? apiProvider === ApiProvider.CLOUD_API
        ? this.parse(response.data)
        : this.parseMsg91(response.data, data.from)
      : response.data
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
    let headers: any = this.headers
    let apiProvider: string = 'cloud-api'

    if (!this.config.db) {
      this.validateApiProvider(this.config.config.apiProvider)
      apiProvider = this.config.config.apiProvider!
    }

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
        apiProvider = waResponse.api_provider
        whatsappBusinessId = waResponse.whatsapp_business_id
        if (apiProvider === ApiProvider.CLOUD_API) {
          headers = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + waResponse.access_token,
          }
        }
        if (apiProvider === ApiProvider.MAG91_API) {
          headers = {
            'Content-Type': 'application/json',
            'authkey': waResponse.access_token,
          }
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
      headers: headers,
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

  private parse(data: WhatsAppResult): WhatsAppResultContract {
    return {
      input: Number(data.contacts[0].input),
      phone: data.contacts[0].wa_id,
      wamid: data.messages[0].id,
    }
  }

  private parseMsg91(data: Msg91Result, from: string): WhatsAppResultContract {
    return {
      input: 0,
      phone: from,
      wamid: data.request_id,
    }
  }

  /**
   * Validates if the provided apiProvider is one of the allowed values.
   * @param apiProvider - The apiProvider to validate.
   * @throws {Error} - Throws an error if apiProvider is not valid.
   */
  private validateApiProvider(apiProvider?: string) {
    if (!apiProvider) {
      throw new Error('API provider is required: cloud-api | msg91.')
    }

    if (!Object.values(ApiProvider).includes(apiProvider as ApiProvider)) {
      throw new Error(
        `Invalid API provider. Expected one of: ${Object.values(ApiProvider).join(', ')}.`
      )
    }
  }

  private getHeaders(apiProvider: string, accessToken?: string): any {
    const headers: any = { 'Content-Type': 'application/json' }
    if (apiProvider === ApiProvider.CLOUD_API) {
      headers['Authorization'] = 'Bearer ' + accessToken
    } else if (apiProvider === ApiProvider.MAG91_API) {
      headers['authkey'] = accessToken
    }
    return headers
  }

  // private async getDbConfig(from?: number) {
  //   if (this.config.db && from) {
  //     if (!this.connection) {
  //       this.connection = this.db.connection(this.config.db.connectionName)
  //     }
  //     const waResponse = await this.db
  //       .query()
  //       .select('*')
  //       .from(this.config.db!.tableName)
  //       .where('id', from)
  //       .first()

  //     if (waResponse) {
  //       return waResponse
  //     }
  //     throw new Error('Incorrect Phone Number ID')
  //   }
  //   return null
  // }
}
