import { APICommand, selectFromList, outputItem, SelectFromListConfig } from '@smartthings/cli-lib'
import { SchemaApp } from '@smartthings/core-sdk'


export default class SchemaAppRegenerateCommand extends APICommand<typeof SchemaAppRegenerateCommand.flags> {
	static description = 'Regenerate the clientId and clientSecret of the ST Schema connector. The previous values will be invalidated, which may affect existing installations.'

	static flags = {
		...APICommand.flags,
		...outputItem.flags,
	}

	static args = [{
		name: 'id',
		description: 'schema app id',
	}]

	async run(): Promise<void> {
		const config: SelectFromListConfig<SchemaApp> = {
			primaryKeyName: 'endpointAppId',
			sortKeyName: 'appName',
		}
		const id = await selectFromList(this, config, {
			preselectedId: this.args.id,
			listItems: async () => await this.client.schema.list(),
			promptMessage: 'Select a schema app to regenerate its clientId and clientSecret.',
		})

		await outputItem(this, { tableFieldDefinitions: ['endpointAppId', 'stClientId', 'stClientSecret'] }, () =>
			this.client.schema.regenerateOauth(id))
	}
}
