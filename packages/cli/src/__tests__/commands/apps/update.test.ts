import { inputAndOutputItem } from '@smartthings/cli-lib'
import { AppUpdateRequest, AppsEndpoint } from '@smartthings/core-sdk'
import AppUpdateCommand from '../../../commands/apps/update'
import { chooseApp, tableFieldDefinitions } from '../../../lib/commands/apps-util'
import { addPermission } from '../../../lib/aws-utils'


jest.mock('../../../lib/aws-utils')

jest.mock('../../../lib/commands/apps-util')

describe('AppUpdateCommand', () => {
	const appId = 'appId'
	const mockInputAndOutputItem = jest.mocked(inputAndOutputItem)
	const mockAddPermission = jest.mocked(addPermission)
	const mockChooseApp = jest.mocked(chooseApp)
	const updateSpy = jest.spyOn(AppsEndpoint.prototype, 'update').mockImplementation()

	beforeAll(() => {
		mockChooseApp.mockResolvedValue(appId)
	})

	it('prompts user to choose app', async () => {
		await expect(AppUpdateCommand.run([])).resolves.not.toThrow()

		expect(chooseApp).toBeCalledWith(
			expect.any(AppUpdateCommand),
			undefined,
		)
	})

	it('calls inputOutput with correct config', async () => {
		await expect(AppUpdateCommand.run([])).resolves.not.toThrow()

		expect(mockInputAndOutputItem).toBeCalledWith(
			expect.any(AppUpdateCommand),
			expect.objectContaining({
				tableFieldDefinitions,
			}),
			expect.any(Function),
		)
	})

	it('calls correct update endpoint', async () => {
		const appRequest = {
			displayName: 'app',
		} as AppUpdateRequest
		mockInputAndOutputItem.mockImplementationOnce(async (_command, _config, actionFunction) => {
			await actionFunction(undefined, appRequest)
		})
		mockChooseApp.mockResolvedValueOnce(appId)

		await expect(AppUpdateCommand.run([appId])).resolves.not.toThrow()

		expect(updateSpy).toBeCalledWith(appId, appRequest)
	})

	it('accepts authorize flag for lambda apps', async () => {
		const arn = 'arn'
		const anotherArn = 'anotherArn'
		const appRequest = {
			lambdaSmartApp: {
				functions: [arn, anotherArn],
			},
		} as AppUpdateRequest
		mockInputAndOutputItem.mockImplementationOnce(async (_command, _config, actionFunction) => {
			await actionFunction(undefined, appRequest)
		})
		mockChooseApp.mockResolvedValueOnce(appId)

		await expect(AppUpdateCommand.run([appId, '--authorize'])).resolves.not.toThrow()

		expect(addPermission).toBeCalledTimes(2)
		expect(addPermission).toBeCalledWith(arn, undefined, undefined)
		expect(addPermission).toBeCalledWith(anotherArn, undefined, undefined)
		expect(updateSpy).toBeCalledWith(appId, appRequest)
	})

	it('throws error if authorize flag is used on non-lambda app', async () => {
		const appRequest = {
			webhookSmartApp: {},
		} as AppUpdateRequest
		mockInputAndOutputItem.mockImplementationOnce(async (_command, _config, actionFunction) => {
			await actionFunction(undefined, appRequest)
		})

		await expect(AppUpdateCommand.run(['--authorize'])).rejects.toThrow('Authorization is not applicable to WebHook SmartApps')
		expect(updateSpy).not.toBeCalled()
	})

	it('ignores authorize flag for lambda apps with no functions', async () => {
		const appRequest = {
			lambdaSmartApp: {
				functions: [],
			},
		} as unknown as AppUpdateRequest
		mockInputAndOutputItem.mockImplementation(async (_command, _config, actionFunction) => {
			await actionFunction(undefined, appRequest)
		})
		mockChooseApp.mockResolvedValue(appId)

		await expect(AppUpdateCommand.run([appId, '--authorize'])).resolves.not.toThrow()

		expect(addPermission).not.toBeCalled()
		expect(updateSpy).toBeCalledWith(appId, appRequest)

		updateSpy.mockClear()
	})

	it('calls addPermission with principal flag', async () => {
		const arn = 'arn'
		const appRequest = {
			lambdaSmartApp: {
				functions: [arn],
			},
		} as AppUpdateRequest
		mockInputAndOutputItem.mockImplementationOnce(async (_command, _config, actionFunction) => {
			await actionFunction(undefined, appRequest)
		})

		const principal = 'principal'
		await expect(AppUpdateCommand.run(['--authorize', `--principal=${principal}`])).resolves.not.toThrow()

		expect(addPermission).toBeCalledWith(arn, principal, undefined)
	})

	it('calls addPermission with statement-id flag', async () => {
		const arn = 'arn'
		const appRequest: AppUpdateRequest = {
			lambdaSmartApp: {
				functions: [arn],
			},
		} as AppUpdateRequest
		mockInputAndOutputItem.mockImplementationOnce(async (_command, _config, actionFunction) => {
			await actionFunction(undefined, appRequest)
		})

		const statementId = 'statementId'
		await expect(AppUpdateCommand.run(['--authorize', `--statement=${statementId}`])).resolves.not.toThrow()

		expect(addPermission).toBeCalledWith(arn, undefined, statementId)
	})

	it('ignores already authorized functions', async () => {
		const arn = 'arn'
		const appRequest: AppUpdateRequest = {
			lambdaSmartApp: {
				functions: [arn],
			},
		} as AppUpdateRequest
		mockInputAndOutputItem.mockImplementationOnce(async (_command, _config, actionFunction) => {
			await actionFunction(undefined, appRequest)
		})

		mockAddPermission.mockResolvedValueOnce('Already authorized')

		await expect(AppUpdateCommand.run(['--authorize'])).resolves.not.toThrow()

		expect(addPermission).toBeCalledWith(arn, undefined, undefined)
	})
})
