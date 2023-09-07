/*
 * @brighthustle/adonisjs-whatsapp
 *
 * (c) Brighthustle
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */
export default class Helpers {
  static isUrl(string: string) {
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

  static translateType(
    type: any
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
    const types: any = {
      button_reply: 'button',
      list_reply: 'list',
    }

    return types[type] || type
  }

  static translateInteractive(message: Record<string, any>) {
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
}
