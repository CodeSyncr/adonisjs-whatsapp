![adonisjs-whatsapp](https://socialify.git.ci/Bright-Hustle/adonisjs-whatsapp/image?description=1&descriptionEditable=Package%20makes%20it%20easy%20for%20adonis%20to%20access%20the%20WhatsApp%20Cloud%20API&forks=1&issues=1&language=1&logo=https%3A%2F%2Fupload.wikimedia.org%2Fwikipedia%2Fcommons%2Fthumb%2F6%2F6b%2FWhatsApp.svg%2F1024px-WhatsApp.svg.png%3F20220228223904&name=1&owner=1&pattern=Circuit%20Board&pulls=1&stargazers=1&theme=Light)

## What's this

This package makes it easy for developers to access the [WhatsApp Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api) service in the AdonisJS 5 application.

## Getting Started

Please create and configure your Facebook WhatsApp application by following the ["Get Started"](https://developers.facebook.com/docs/whatsapp/cloud-api/get-started) section of the official guide.

## Setup

Install the package using npm or yarn:

```bash
npm i @brighthustle/adonisjs-whatsapp
# or
yarn add @brighthustle/adonisjs-whatsapp
```

Then, configure the package using the configure command:

```bash
node ace configure @brighthustle/adonisjs-whatsapp
```

After executing the above command, a `config/whatsapp.ts` file will be created, where you can define the WhatsApp Cloud API.

An important step is to set environment variables in your `.env` and validate them in the `env.ts` file.

```ts
WABA_PHONE_ID: Env.schema.string(),
WABA_ID: Env.schema.string(),
WABA_TOKEN: Env.schema.string(),
WABA_VERIFY: Env.schema.string(),
```

## Usage

The package supports events that are triggered when receiving a webhook from WhatsApp, some of which can be seen [here](./adonis-typings/events.ts).

The event can be subscribed to via the start/whatsapp.ts file.

```ts
// start/whatsapp.ts

import WhatsApp from '@ioc:Adonis/Addons/WhatsApp'

WhatsApp.on('message:text', function (message) {
  // TODO: do whatever you want
})
```

To send text, images, and more, use the same singleton in your preload or controller file.

```ts
// app/Controllers/Http/ExampleController.ts

import WhatsApp from '@ioc:Adonis/Addons/WhatsApp'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class ExampleController {
  public async example(_ctx: HttpContextContract) {
    await WhatsApp.sendText(0000000000, 'Lorem ipsum dolor sit amet.')
  }
}
```

## Features

- [x] Mark messages as read
- [x] Upload media to the WhatsApp server
- [x] Download media from the WhatsApp server
- [x] Send text messages
- [x] Send images
- [x] Send documents
- [x] Send audios
- [x] Send videos
- [x] Send stickers
- [x] Send locations
- [x] Send template messages
- [x] Send contacts
- [x] Send reply button messages
- [x] Send list messages
- [x] Include a Webhook Endpoint
- [x] Event listener when receiving a webhook
- [x] Create Template
- [x] Get Templates
- [x] Delete Template
- [ ] Get Analytics
- [ ] Get Phone Numbers, Display Name
- [ ] QR Codes Action
- [ ] Get Business Account Details & Extended Credit


## Changelog

Please see the [CHANGELOG](./CHANGELOG.md) for more information on what has changed recently.

## License

The MIT License (MIT). Please see [LICENSE](./LICENSE.md) file for more information.

## Disclaimer

This package is not officially maintained by Facebook. WhatsApp and Facebook trademarks and logos are the property of Meta Platforms, Inc.

## NOTICE

This package is modified from the original package https://github.com/sooluh/adonisjs-whatsapp Written By : sooluh