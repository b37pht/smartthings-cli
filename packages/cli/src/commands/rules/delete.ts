import { Flags } from '@oclif/core'

import { APICommand } from '@smartthings/cli-lib'

import { chooseRule, getRuleWithLocation } from '../../lib/commands/rules-util'


export default class RulesDeleteCommand extends APICommand<typeof RulesDeleteCommand.flags> {
	static description = 'delete a rule'

	static flags = {
		...APICommand.flags,
		location: Flags.string({
			char: 'l',
			description: 'a specific location to query',
			helpValue: '<UUID>',
		}),
	}

	static args = [{
		name: 'id',
		description: 'rule UUID',
	}]

	async run(): Promise<void> {
		const ruleId = await chooseRule(this, 'Select a rule to delete.', this.flags.location, this.args.id)

		const locationId = this.flags.location
			?? (await getRuleWithLocation(this.client, ruleId, this.flags.location)).locationId

		await this.client.rules.delete(ruleId, locationId)
		this.log(`Rule ${ruleId} deleted.`)
	}
}
