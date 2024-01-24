/*
 * @brighthustle/adonisjs-whatsapp
 *
 * (c) Brighthustle
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import type Configure from '@adonisjs/core/commands/configure'
import { stubsRoot } from './stubs/main.js'
import string from '@adonisjs/core/helpers/string'

const AVAILABLE_PROVIDERS = ['lucid', 'local']

export async function configure(command: Configure) {
  let selectedProviders: string[] | string | undefined = command.parsedFlags.providers

  async function getModelName(): Promise<string> {
    return await command.prompt.ask('Enter model name to be used for whatsapp config', {
      validate(value) {
        return !value || !value.trim().length ? 'Model name is required.' : true
      },
    })
  }

  // async function getMigrationConsent(tableName: string): Promise<boolean> {
  //   return await command.prompt.confirm(`Create migration for the ${tableName} table?`)
  // }
  /**
   * Otherwise force prompt for selection
   */
  if (!selectedProviders) {
    selectedProviders = await command.prompt.multiple(
      'Select the providers you plan to use',
      AVAILABLE_PROVIDERS,
      {
        validate(value) {
          return !value || !value.length ? 'Select a provider to configure the package' : true
        },
      }
    )
  }

  /**
   * Cast CLI string value to an array
   */
  let providers = (
    typeof selectedProviders === 'string' ? [selectedProviders] : selectedProviders
  ) as string[]

  const unknownProvider = providers.find((provider) => !AVAILABLE_PROVIDERS.includes(provider))

  if (unknownProvider) {
    command.exitCode = 1
    command.logger.error(`Invalid provider "${unknownProvider}"`)
    return
  }

  const codemods = await command.createCodemods()
  if (providers.includes('lucid')) {
    const modelNameInput: string = await getModelName()
    const modelName = string
      .create(modelNameInput.replace(/(\.ts|\.js)$/, ''))
      .singular()
      .pascalCase()
    const tableName = string.create(modelName).snakeCase().plural()
    // const modelReference = string.create(modelName).singular().camelCase()
    // // const modelNameSpace =

    // const migrationConsent = await getMigrationConsent(tableName.toString())
    const migrationName = `${Date.now()}_${tableName}`

    // const camelCaseSchemaName = string.create(tableName).camelCase().suffix('_schema')
    if (modelNameInput) {
      /**
       * Publish model file
       */
      await codemods.makeUsingStub(stubsRoot, `make/model/whatsapp_config.stub`, {
        name: modelNameInput,
      })

      /**
       * Publish migration file
       */
      await codemods.makeUsingStub(stubsRoot, `make/migration/whatsapp_config.stub`, {
        fileName: migrationName,
        tableName: tableName,
      })
    }
  }

  /**
   * Publish config file
   */
  await codemods.makeUsingStub(stubsRoot, 'config/whatsapp.stub', {
    providers: providers,
  })

  /**
   * Publish start file
   */
  await codemods.makeUsingStub(stubsRoot, 'start/whatsapp.stub', {})

  // Add provider to rc file
  await codemods.updateRcFile((rcFile: any) => {
    rcFile.addProvider('@brighthustle/adonisjs-whatsapp/whatsapp_provider')
  })
}
