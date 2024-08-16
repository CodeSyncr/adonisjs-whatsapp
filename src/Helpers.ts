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

  public static transformToMsg91SendTemplate(
    integrated_number: string,
    name: string,
    language: string,
    components: ComponentOptions[],
    to: number
  ): Msg91TemplatePayload {
    const msg91TemplatePayload: Msg91TemplatePayload = {
      integrated_number,
      content_type: 'template',
      payload: {
        type: 'template',
        messaging_product: 'whatsapp',
        template: {
          name,
          language: {
            code: language,
            policy: 'deterministic', // or adjust according to your needs
          },
          to_and_components: [
            {
              to: [to!.toString()],
              components: components.reduce((acc, component) => {
                component.parameters.forEach((parameter, index) => {
                  let componentKey: string
                  let componentValue:
                    | { type: string; value: string }
                    | { type: string; subtype: string; value: string }

                  if (component.type === 'header') {
                    componentKey = `header_${index + 1}`
                  } else if (component.type === 'body') {
                    componentKey = `body_${index + 1}`
                  } else if (component.type === 'button') {
                    componentKey = `button_${index + 1}`
                  } else {
                    return
                  }

                  componentValue = {
                    type: parameter.type,
                    value: this.extractParameterValue(parameter),
                  }

                  acc[componentKey] = componentValue
                })

                return acc
              }, {} as Record<string, { type: string; value: string } | { type: string; subtype: string; value: string }>),
            },
          ],
        },
      },
    }

    return msg91TemplatePayload
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
