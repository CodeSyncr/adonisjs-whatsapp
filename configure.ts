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

const ENV_VARIABLES = {
  lucid: ['DB_NAME', 'DB_CONNECTION'],
  local: ['WABA_PHONE_ID', 'WABA_ID', 'WABA_TOKEN', 'WABA_VERIFY'],
}

const KNOWN_PROVIDERS = Object.keys(ENV_VARIABLES)

export async function configure(command: Configure) {
  let selectedProviders: string[] | string | undefined = command.parsedFlags.providers
  let tableName: string | null = null
  async function getModelName(): Promise<string> {
    return await command.prompt.ask('Enter model name to be used for whatsapp config', {
      validate(value) {
        return !value || !value.trim().length ? 'Model name is required.' : true
      },
    })
  }
  /**
   * Otherwise force prompt for selection
   */
  if (!selectedProviders) {
    selectedProviders = await command.prompt.multiple(
      'Select the providers you plan to use',
      KNOWN_PROVIDERS,
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

  const unknownProvider = providers.find((provider) => !KNOWN_PROVIDERS.includes(provider))

  if (unknownProvider) {
    command.exitCode = 1
    command.logger.error(
      `Invalid provider "${unknownProvider}"! Supported providers are: ${string.sentence(
        KNOWN_PROVIDERS
      )}`
    )
    return
  }

  const codemods = await command.createCodemods()
  if (providers.includes('lucid')) {
    const modelNameInput: string = await getModelName()
    const modelName = string
      .create(modelNameInput.replace(/(\.ts|\.js)$/, ''))
      .singular()
      .pascalCase()
    tableName = string.create(modelName).snakeCase().plural().toString()
    const migrationName = `${Date.now()}_${tableName}.ts`
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
    tableName: tableName,
  })

  /**
   * Publish start file
   */
  await codemods.makeUsingStub(stubsRoot, 'start/whatsapp.stub', {})

  /**
   * Add Provider
   */
  await codemods.updateRcFile((rcFile: any) => {
    rcFile.addProvider('@brighthustle/adonisjs-whatsapp/whatsapp_provider')
  })

  /**
   * Define env variables for the selected transports
   */
  await codemods.defineEnvVariables(
    providers.reduce<Record<string, string>>((result, provider) => {
      ENV_VARIABLES[provider as keyof typeof ENV_VARIABLES].forEach((envVariable) => {
        result[envVariable] = ''
      })
      return result
    }, {})
  )

  /**
   * Define env variables validation for the selected transports
   */
  await codemods.defineEnvValidations({
    leadingComment: 'Variables for configuring the mail package',
    variables: providers.reduce<Record<string, string>>((result, provider) => {
      ENV_VARIABLES[provider as keyof typeof ENV_VARIABLES].forEach((envVariable) => {
        result[envVariable] = 'Env.schema.string()'
      })
      return result
    }, {}),
  })
}
