import { ComponentOptions, ParameterObject } from '@ioc:Adonis/Addons/WhatsApp'
import { Msg91TemplatePayload } from './types/types'

export default class Helpers {
  public static isUrl(string: string) {
    const pattern = new RegExp(
      '^(https?:\\/\\/)?' +
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' +
        '((\\d{1,3}\\.){3}\\d{1,3}))' +
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' +
        '(\\?[;&a-z\\d%_.~+=-]*)?' +
        '(\\#[-a-z\\d_]*)?$',
      'i'
    )

    return !!pattern.test(string)
  }

  public static translateType(
    type: string
  ):
    | 'text'
    | 'image'
    | 'document'
    | 'audio'
    | 'video'
    | 'sticker'
    | 'location'
    | 'contacts'
    | 'button'
    | 'list' {
    const types = {
      button_reply: 'button',
      list_reply: 'list',
    }

    return types[type] || type
  }

  public static translateInteractive(message: Record<string, any>) {
    if (!message || !message.type || message.type !== 'interactive') return null

    return {
      type: message.interactive.type as string,
      data: message.interactive[message.interactive.type] as {
        id: string
        title: string
        description?: string
      },
    }
  }

  public static translateInteractiveMsg91(message: Record<string, any>) {
    if (!message || !message.content_type || message.content_type !== 'interactive') return null
    return {
      type: message.interactive.type as string,
      data: message.interactive[message.interactive.type] as {
        id: string
        title: string
        description?: string
      },
    }
  }

  public static transformToMsg91SendTemplate(
    integrated_number: string,
    name: string,
    language: string,
    components: ComponentOptions[],
    to: number
  ): Msg91TemplatePayload {
    const toAndComponents = {
      to: [`91${to.toString()}`],
      components: {} as Record<string, { type: string; value: string; sub_type?: string }>,
    }

    components.forEach((component) => {
      component.parameters.forEach((parameter, index) => {
        const componentKey = `${component.type}_${index + 1}`
        toAndComponents.components[componentKey] = {
          type: parameter.type,
          value: this.extractParameterValue(parameter),
          ...(component.type === 'button' && component.sub_type
            ? { sub_type: component.sub_type }
            : {}),
        }
      })
    })

    return {
      integrated_number,
      content_type: 'template',
      payload: {
        type: 'template',
        messaging_product: 'whatsapp',
        template: {
          name,
          language: {
            code: language,
            policy: 'deterministic', // Adjust as needed
          },
          to_and_components: [toAndComponents],
        },
      },
    }
  }

  private static extractParameterValue(parameter: ParameterObject): string {
    switch (parameter.type) {
      case 'text':
        return parameter.text || ''
      case 'payload':
        return parameter.payload || ''
      case 'currency':
        return `${parameter.currency?.amount_1000} ${parameter.currency?.code}` || ''
      case 'date_time':
        return `${parameter.date_time?.fallback_value}` || ''
      case 'image':
      case 'document':
      case 'video':
        return parameter[parameter.type]?.link || '' // Assuming you want to extract the URL of the media
      default:
        return ''
    }
  }
}
