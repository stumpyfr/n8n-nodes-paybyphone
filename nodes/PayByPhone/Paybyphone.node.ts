import type { IExecuteFunctions, INodeExecutionData, INodeType, INodeTypeDescription } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { PayByPhoneAPI } from './lib/api';
import { nodeDescription } from './description';

/* eslint-disable @n8n/community-nodes/icon-validation */
export class Paybyphone implements INodeType {
	description: INodeTypeDescription = nodeDescription;

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const credentials = await this.getCredentials('PayByPhoneApi') as {
			mobileNumber: string;
			password: string;
		};

		const api = new PayByPhoneAPI();
		const accessToken = await api.getAccessToken(
			this.helpers,
			credentials.mobileNumber,
			credentials.password,
		);

		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const node = this;
		const withErrorHandling = async (itemIndex: number, fn: () => Promise<void>): Promise<void> => {
			try {
				await fn();
			} catch (error) {
				if (node.continueOnFail()) {
					returnData.push({
						json: node.getInputData(itemIndex)[0].json,
						error,
						pairedItem: itemIndex,
					});
				} else {
					/* eslint-disable @typescript-eslint/no-explicit-any */
					if ((error as any).context) {
						(error as any).context.itemIndex = itemIndex;
						throw error;
					}
					throw new NodeOperationError(node.getNode(), error as Error, { itemIndex });
				}
			}
		};

		if (resource === 'vehicle' && operation === 'list') {
			const includeArchived = this.getNodeParameter(
				'additionalFields.includeArchived',
				0,
				false,
			) as boolean;
			for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
				await withErrorHandling(itemIndex, async () => {
					const vehicles = await api.getVehicles(this.helpers, accessToken);
					for (const vehicle of vehicles) {
						if (!includeArchived && vehicle.archived) continue;
						returnData.push({ json: { ...vehicle } });
					}
				});
			}
		}

		if (resource === 'location' && operation === 'list') {
			for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
				await withErrorHandling(itemIndex, async () => {
					const locations = await api.getLocations(
						this.helpers,
						accessToken,
						this.getNodeParameter('location', itemIndex) as string,
					);
					for (const location of locations) {
						returnData.push({ json: { ...location } });
					}
				});
			}
		}

		if (resource === 'paymentMethod' && operation === 'list') {
			for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
				await withErrorHandling(itemIndex, async () => {
					const paymentMethods = await api.getPaymentMethods(this.helpers, accessToken);
					for (const card of paymentMethods.paymentCards) {
						returnData.push({ json: { ...card } });
					}
				});
			}
		}

		if (resource === 'rate' && operation === 'get') {
			for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
				await withErrorHandling(itemIndex, async () => {
					const rates = await api.getRate(
						this.helpers,
						accessToken,
						this.getNodeParameter('locationId', itemIndex) as string,
						this.getNodeParameter('licensePlate', itemIndex) as string,
					);
					for (const rate of rates) {
						returnData.push({ json: { ...rate } });
					}
				});
			}
		}

		if (resource === 'quote' && operation === 'get') {
			for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
				await withErrorHandling(itemIndex, async () => {
					const quote = await api.getQuote(
						this.helpers,
						accessToken,
						this.getNodeParameter('locationId', itemIndex) as string,
						this.getNodeParameter('licensePlate', itemIndex) as string,
						this.getNodeParameter('timeUnit', itemIndex) as string,
						this.getNodeParameter('timeUnits', itemIndex) as number,
						this.getNodeParameter('ratePolicyId', itemIndex) as string,
					);
					returnData.push({ json: { ...quote } });
				});
			}
		}

		if (resource === 'parkingSession') {
			if (operation === 'list') {
				const includePast = this.getNodeParameter(
					'additionalFields.includePastSessions',
					0,
					false,
				) as boolean;
				for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
					await withErrorHandling(itemIndex, async () => {
						const sessions = await api.getParkingSessions(this.helpers, accessToken, 'CURRENT');
						for (const session of sessions) {
							returnData.push({ json: { ...session } });
						}
						if (includePast) {
							const history = await api.getParkingSessions(this.helpers, accessToken, 'HISTORIC');
							for (const session of history) {
								returnData.push({ json: { ...session } });
							}
						}
					});
				}
			}

			if (operation === 'start') {
				for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
					await withErrorHandling(itemIndex, async () => {
						const response = await api.startParkingSession(
							this.helpers,
							accessToken,
							this.getNodeParameter('quoteId', itemIndex) as string,
							this.getNodeParameter('paymentAccountId', itemIndex) as string,
						);
						returnData.push({ json: { ...response } });
					});
				}
			}
		}

		return [returnData];
	}
}
