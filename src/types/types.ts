export interface Msg91TemplatePayload {
  integrated_number: string
  content_type: 'template'
  payload: {
    type: 'template'
    template: {
      name: string
      language: {
        code: string
        policy: string
      }
      to_and_components: Array<{
        to: string[]
        components: {
          [key: string]: {
            type: string
            value: string
          }
        }
      }>
    }
    messaging_product: 'whatsapp'
  }
}
