import { join } from 'path'
import * as sinkStatic from '@adonisjs/sink'
import { string } from '@poppinss/utils/build/helpers'
import { ApplicationContract } from '@ioc:Adonis/Core/Application'

type InstructionsState = {
  modelName?: string
  modelReference?: string
  modelNamespace?: string

  whatsappTableName: string
  whatsappSchemaName: string

  provider: 'lucid' | 'local'
}

const CONFIG_PARTIALS_BASE = './config/partials'

/**
 * Prompt choices for the provider selection
 */
const PROVIDER_PROMPT_CHOICES = [
  {
    name: 'lucid' as const,
    message: 'Lucid',
    hint: ' (Uses Data Models)',
  },
  {
    name: 'local' as const,
    message: 'Local',
    hint: ' (Uses ENV variable)',
  },
]

/**
 * Returns absolute path to the stub relative from the templates
 * directory
 */
function getStub(...relativePaths: string[]) {
  return join(__dirname, 'templates', ...relativePaths)
}

/**
 * Creates the model file
 */
function makeModel(
  projectRoot: string,
  app: ApplicationContract,
  sink: typeof sinkStatic,
  state: InstructionsState
) {
  const modelsDirectory = app.resolveNamespaceDirectory('models') || 'app/Models'
  const modelPath = join(modelsDirectory, `${state.modelName}.ts`)

  const template = new sink.files.MustacheFile(projectRoot, modelPath, getStub('model.txt'))
  if (template.exists()) {
    sink.logger.action('create').skipped(`${modelPath} file already exists`)
    return
  }

  template.apply(state).commit()
  sink.logger.action('create').succeeded(modelPath)
}

/**
 * Create the migration file
 */
function makeMigration(
  projectRoot: string,
  app: ApplicationContract,
  sink: typeof sinkStatic,
  state: InstructionsState
) {
  const migrationsDirectory = app.directoriesMap.get('migrations') || 'database'
  const migrationPath = join(migrationsDirectory, `${Date.now()}_${state.whatsappTableName}.ts`)

  const template = new sink.files.MustacheFile(
    projectRoot,
    migrationPath,
    getStub('migrations/whatsapp_config.txt')
  )
  if (template.exists()) {
    sink.logger.action('create').skipped(`${migrationPath} file already exists`)
    return
  }

  template.apply(state).commit()
  sink.logger.action('create').succeeded(migrationPath)
}

/**
 * Makes the auth config file
 */
function makeConfig(
  projectRoot: string,
  app: ApplicationContract,
  sink: typeof sinkStatic,
  state: InstructionsState
) {
  const configDirectory = app.directoriesMap.get('config') || 'config'
  const configPath = join(configDirectory, 'whatsapp.ts')

  const template = new sink.files.MustacheFile(
    projectRoot,
    configPath,
    getStub('config/whatsapp.txt')
  )
  template.overwrite = true

  const partials: any = {
    wa_config: getStub(CONFIG_PARTIALS_BASE, `whatsapp-${state.provider}.txt`),
  }

  template.apply(state).partials(partials).commit()
  sink.logger.action('create').succeeded(configPath)
}

/**
 * Prompts user for the model name
 */
async function getModelName(sink: typeof sinkStatic): Promise<string> {
  return sink.getPrompt().ask('Enter model name to be used for whatsapp config', {
    validate(value) {
      return !!value.trim().length
    },
  })
}

/**
 * Prompts user for the table name
 */
// async function getTableName(sink: typeof sinkStatic): Promise<string> {
//   return sink.getPrompt().ask('Enter the database table name to look up whatsapp config', {
//     validate(value) {
//       return !!value.trim().length
//     },
//   })
// }

/**
 * Prompts user for the table name
 */
async function getMigrationConsent(sink: typeof sinkStatic, tableName: string): Promise<boolean> {
  return sink
    .getPrompt()
    .confirm(`Create migration for the ${sink.logger.colors.underline(tableName)} table?`)
}

/**
 * Prompts user to select the provider
 */
async function getProvider(sink: typeof sinkStatic) {
  return sink.getPrompt().choice('Select provider for whatsapp config', PROVIDER_PROMPT_CHOICES, {
    validate(choice) {
      return choice && choice.length ? true : 'Select the provider for configuration of whatsapp'
    },
  })
}

/**
 * Instructions to be executed when setting up the package.
 */
export default async function instructions(
  projectRoot: string,
  app: ApplicationContract,
  sink: typeof sinkStatic
) {
  const state: InstructionsState = {
    whatsappTableName: '',
    whatsappSchemaName: '',
    provider: 'lucid',
  }

  state.provider = await getProvider(sink)

  /**
   * Make model when provider is lucid otherwise prompt for the database
   * table name
   */
  if (state.provider === 'lucid') {
    const modelName = await getModelName(sink)
    state.modelName = string.pascalCase(string.singularize(modelName.replace(/(\.ts|\.js)$/, '')))
    state.whatsappTableName = string.pluralize(string.snakeCase(state.modelName))
    state.modelReference = string.camelCase(string.singularize(state.modelName))
    state.modelNamespace = `${app.namespacesMap.get('models') || 'App/Models'}/${state.modelName}`

    const migrationConsent = await getMigrationConsent(sink, state.whatsappTableName)

    /**
     * Pascal case
     */
    const camelCaseSchemaName = string.camelCase(`${state.whatsappTableName}_schema`)
    state.whatsappSchemaName = `${camelCaseSchemaName
      .charAt(0)
      .toUpperCase()}${camelCaseSchemaName.slice(1)}`

    /**
     * Make model when prompted for it
     */
    if (state.modelName) {
      makeModel(projectRoot, app, sink, state)
    }

    /**
     * Make users migration file
     */
    if (migrationConsent) {
      makeMigration(projectRoot, app, sink, state)
    }
  }

  /**
   * Make config file
   */
  makeConfig(projectRoot, app, sink, state)
}
