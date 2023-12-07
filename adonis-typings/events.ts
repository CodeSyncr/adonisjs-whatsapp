declare module '@ioc:Adonis/Core/Event' {
  import { WhatsAppMessageContract, WhatsAppStatusContract } from '@ioc:Adonis/Addons/WhatsApp'

  interface EventsList {
    // 'wa:message:text': WhatsAppMessageContract
    [key: `wa:message:text:${string}`]: WhatsAppMessageContract

    // 'wa:message:image': WhatsAppMessageContract
    [key: `wa:message:image:${string}`]: WhatsAppMessageContract

    // 'wa:message:document': WhatsAppMessageContract
    [key: `wa:message:document:${string}`]: WhatsAppMessageContract

    // 'wa:message:audio': WhatsAppMessageContract
    [key: `wa:message:audio:${string}`]: WhatsAppMessageContract

    // 'wa:message:video': WhatsAppMessageContract
    [key: `wa:message:video:${string}`]: WhatsAppMessageContract

    // 'wa:message:sticker': WhatsAppMessageContract
    [key: `wa:message:sticker:${string}`]: WhatsAppMessageContract

    // 'wa:message:location': WhatsAppMessageContract
    [key: `wa:message:location:${string}`]: WhatsAppMessageContract

    // 'wa:message:contacts': WhatsAppMessageContract
    [key: `wa:message:contacts:${string}`]: WhatsAppMessageContract

    // 'wa:message:button': WhatsAppMessageContract
    [key: `wa:message:button:${string}`]: WhatsAppMessageContract

    // 'wa:message:list': WhatsAppMessageContract
    [key: `wa:message:list:${string}`]: WhatsAppMessageContract

    // 'wa:message:*': WhatsAppMessageContract
    [key: `wa:message:*:${string}`]: WhatsAppMessageContract

    // 'wa:status:sent': WhatsAppStatusContract
    [key: `wa:status:sent:${string}`]: WhatsAppStatusContract

    // 'wa:status:delivered': WhatsAppStatusContract
    [key: `wa:status:delivered:${string}`]: WhatsAppStatusContract

    // 'wa:status:read': WhatsAppStatusContract
    [key: `wa:status:read:${string}`]: WhatsAppStatusContract

    // 'wa:status:*': WhatsAppStatusContract
    [key: `wa:status:*:${string}`]: WhatsAppStatusContract

    // 'wa:*': WhatsAppMessageContract | WhatsAppStatusContract
    [key: `wa:*:${string}`]: WhatsAppMessageContract | WhatsAppStatusContract
  }
}
