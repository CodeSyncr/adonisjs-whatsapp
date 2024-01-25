The package has been configured successfully. The Adonis WhatsApp configuration stored inside `config/whatsapp.ts` file relies on the following environment variables, and hence we recommend validating them.

Open the `env.ts` file and paste the following code inside the `Env.rules` object.

### Variables for the Lucid driver

```ts
PG_DB_NAME: Env.schema.string(),
DB_CONNECTION: Env.schema.string.optional(),
DB_TABLE: Env.schema.string(),
```

### Variables for the Local driver

```ts
WABA_PHONE_ID: Env.schema.string(),
WABA_ID: Env.schema.string(),
WABA_TOKEN: Env.schema.string(),
WABA_VERIFY: Env.schema.string(),
```