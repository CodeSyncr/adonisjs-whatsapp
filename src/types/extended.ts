/*
 * @brighthustle/adonisjs-whatsapp
 *
 * (c) Brighthustle
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import { WhatsAppMessageContract, WhatsAppStatusContract, WhatsappService } from './main.js'
declare module '@adonisjs/core/types' {
  export interface ContainerBindings {
    whatsapp: WhatsappService
  }
}

declare module '@adonisjs/core/events' {
  interface EventsList {
    'wa:message:text': WhatsAppMessageContract
    'wa:message:image': WhatsAppMessageContract
    'wa:message:document': WhatsAppMessageContract
    'wa:message:audio': WhatsAppMessageContract
    'wa:message:video': WhatsAppMessageContract
    'wa:message:sticker': WhatsAppMessageContract
    'wa:message:location': WhatsAppMessageContract
    'wa:message:contacts': WhatsAppMessageContract
    'wa:message:button': WhatsAppMessageContract
    'wa:message:list': WhatsAppMessageContract
    'wa:message:*': WhatsAppMessageContract

    'wa:status:sent': WhatsAppStatusContract
    'wa:status:delivered': WhatsAppStatusContract
    'wa:status:read': WhatsAppStatusContract
    'wa:status:*': WhatsAppStatusContract

    'wa:*': WhatsAppMessageContract | WhatsAppStatusContract
  }
}
