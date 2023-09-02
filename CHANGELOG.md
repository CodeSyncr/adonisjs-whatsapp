# CHANGELOG

## 1.0.1
- Readme Update
- Template issue fixes
- Number out of range fix

## 1.0.1
Bug fixes

## 1.0.0

Support `quick_reply` and `url` button in template message


- Optional `description` on `RowObject`
- Rename method:
  - `sendReplyButtons` ⇒ `sendButtons`
  - `readMessage` ⇒ `markAsRead`
- Translate messages with interactive type
- Fix footer options on interactive messages
- Fix it a bit type-safe
- Add method for media:
  - `WhatsApp.uploadMedia(source)`
  - `WhatsApp.downloadMedia(media, [options])`
- Options in `sendText` method are optional
- Type in contact options fixed
- Add return type in `translateType` helper
- Send message endpoint fixed
- Increase default timeout configuration
- `sendSticker` method fixed
- `WhatsApp.sendText(to, text, [options])`
- `WhatsApp.sendImage(to, media, [options])`
- `WhatsApp.sendDocument(to, media, [options])`
- `WhatsApp.sendAudio(to, media)`
- `WhatsApp.sendVideo(to, media, [options])`
- `WhatsApp.sendSticker(to, media)`
- `WhatsApp.sendLocation(to, coordinate, [options])`
- `WhatsApp.sendTemplate(to, template, language, components)`
- `WhatsApp.sendContact(to, contacts)`
- `WhatsApp.sendReplyButtons(to, text, buttons, [options])`
- `WhatsApp.sendList(to, text, button, sections, [options])`
- `WhatsApp.readMessage(wamid)`
- `WhatsApp.on(event, handler)`
