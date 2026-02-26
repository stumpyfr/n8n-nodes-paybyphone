/* eslint-disable @typescript-eslint/no-explicit-any */
import {
	RequestHelperFunctions,
	BaseHelperFunctions,
	BinaryHelperFunctions,
	DeduplicationHelperFunctions,
	FileSystemHelperFunctions,
	SSHTunnelFunctions,
	DataTableProxyFunctions,
	INodeExecutionData,
	IPairedItemData,
	NodeExecutionWithMetadata,
	IBinaryData,
	IDataObject,
	sleep,
} from 'n8n-workflow';
import { QUERIES } from './queries';

type N8nHelpers = RequestHelperFunctions &
	BaseHelperFunctions &
	BinaryHelperFunctions &
	DeduplicationHelperFunctions &
	FileSystemHelperFunctions &
	SSHTunnelFunctions &
	DataTableProxyFunctions & {
		normalizeItems(items: INodeExecutionData | INodeExecutionData[]): INodeExecutionData[];
		constructExecutionMetaData(
			inputData: INodeExecutionData[],
			options: { itemData: IPairedItemData | IPairedItemData[] },
		): NodeExecutionWithMetadata[];
		assertBinaryData(itemIndex: number, parameterData: string | IBinaryData): IBinaryData;
		getBinaryDataBuffer(
			itemIndex: number,
			parameterData: string | IBinaryData,
		): Promise<Buffer>;
		detectBinaryEncoding(buffer: Buffer): string;
		copyInputItems(items: INodeExecutionData[], properties: string[]): IDataObject[];
	};

export class PayByPhoneAPI {
	private readonly CONSUMER_URL = 'https://consumer.paybyphoneapis.com';
	private readonly AUTH_URL = 'https://auth.paybyphoneapis.com';
	private readonly PAYMENTS_URL = 'https://payments.paybyphoneapis.com';
	private readonly GRAPHQL_URL = `${this.CONSUMER_URL}/uapi/graphql`;

	private handleGraphQLError(error: any): never {
		if (error.response?.data?.errors) {
			const message = error.response.data.errors
				.map((err: any) => err.message)
				.join('; ');
			throw new Error(`GraphQL Error: ${message}`);
		}
		throw error;
	}

	private uuidv4(): string {
		return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c) =>
			(+c ^ (Math.floor(Math.random() * 16) & (15 >> (+c / 4)))).toString(16),
		);
	}

	removeGraphQLMetadata = (obj: any): any => {
		Object.keys(obj).forEach(
			(key) =>
				(key.startsWith('__typename') && delete obj[key]) ||
				(obj[key] && typeof obj[key] === 'object' && this.removeGraphQLMetadata(obj[key])),
		);
		return obj;
	};

	async getAccessToken(
		helpers: N8nHelpers,
		mobileNumber: string,
		password: string,
	): Promise<string> {
		const tokenResponse = await helpers.httpRequest({
			method: 'POST',
			url: `${this.AUTH_URL}/token`,
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				origin: 'https://m.paybyphone.com',
				'x-pbp-clienttype': 'WebApp',
			},
			body: new URLSearchParams({
				grant_type: 'password',
				client_id: 'paybyphone_web',
				username: mobileNumber,
				password: password,
			}).toString(),
		});

		const accessToken = tokenResponse.access_token as string;
		if (!accessToken) {
			throw new Error('Failed to obtain access token from PayByPhone');
		}
		return accessToken;
	}

	async getLocations(
		helpers: N8nHelpers,
		accessToken: string,
		location: string,
	): Promise<any> {
		return helpers.httpRequest({
			method: 'GET',
			url: `${this.CONSUMER_URL}/v2/inventory/locations?advertisedLocationNumber=${location}`,
			headers: {
				Authorization: `Bearer ${accessToken}`,
				'x-pbp-clienttype': 'WebApp',
			},
		});
	}

	async getVehicles(helpers: N8nHelpers, accessToken: string): Promise<any> {
		return helpers.httpRequest({
			method: 'GET',
			url: `${this.CONSUMER_URL}/identity/profileservice/v3/members/vehicles/paybyphone`,
			headers: {
				Authorization: `Bearer ${accessToken}`,
				'x-pbp-clienttype': 'WebApp',
			},
		});
	}

	async getPaymentMethods(helpers: N8nHelpers, accessToken: string): Promise<any> {
		return helpers.httpRequest({
			method: 'GET',
			url: `${this.PAYMENTS_URL}/v1/accounts`,
			headers: {
				Authorization: `Bearer ${accessToken}`,
				'x-pbp-clienttype': 'WebApp',
				'x-api-key': 'HS22UMHFDZHhzso3WRCXsYodkAD6PhcB',
			},
		});
	}

	async getParkingSessions(
		helpers: N8nHelpers,
		accessToken: string,
		periodType: 'CURRENT' | 'HISTORIC' = 'CURRENT',
	): Promise<any> {
		const response = await helpers.httpRequest({
			method: 'POST',
			url: this.GRAPHQL_URL,
			headers: {
				Authorization: `Bearer ${accessToken}`,
				'x-pbp-clienttype': 'WebApp',
			},
			body: {
				operationName: null,
				variables: { input: { periodType, offset: 0, limit: 500 } },
				query: QUERIES.GET_PARKING_SESSIONS,
			},
		});

		return this.removeGraphQLMetadata(response.data.getParkingSessionsV1);
	}

	async getRate(
		helpers: N8nHelpers,
		accessToken: string,
		locationId: string,
		vehiclePlate: string,
	): Promise<any> {
		const response = await helpers.httpRequest({
			method: 'POST',
			url: this.GRAPHQL_URL,
			headers: {
				Authorization: `Bearer ${accessToken}`,
				'x-pbp-clienttype': 'WebApp',
				'Content-Type': 'application/json',
			},
			body: {
				operationName: null,
				variables: { input: { locationId, licensePlate: vehiclePlate } },
				query: QUERIES.GET_RATE_OPTIONS,
			},
		});

		return this.removeGraphQLMetadata(response.data.getRateOptionsV1);
	}

	async getQuote(
		helpers: N8nHelpers,
		accessToken: string,
		locationId: string,
		vehicleId: string,
		durationTimeUnit: string,
		duration: number,
		ratePolicyId: string,
	): Promise<any> {
		const response = await helpers
			.httpRequest({
				method: 'POST',
				url: this.GRAPHQL_URL,
				headers: {
					Authorization: `Bearer ${accessToken}`,
					'Content-Type': 'application/json',
				},
				body: {
					operationName: null,
					variables: {
						requests: [
							{
								quoteRequestId: this.uuidv4(),
								product: 'PARKING',
								details: {
									locationId,
									advertisedLocationId: locationId,
									ratePolicyId,
									parkingQuoteOperation: 'Start',
									durationTimeUnit,
									durationQuantity: duration.toString(),
									licensePlate: vehicleId,
									paymentAccountId: '',
									paymentCardType: '',
									paymentScope: '',
								},
							},
						],
					},
					query: QUERIES.CREATE_QUOTES,
				},
			})
			.catch(this.handleGraphQLError.bind(this));

		return this.removeGraphQLMetadata(response.data.createQuotesV1.createQuotesResponse);
	}

	async startParkingSession(
		helpers: N8nHelpers,
		accessToken: string,
		quoteId: string,
		paymentAccountId: string,
	): Promise<any> {
		// Step 1: Start the parking session
		const sessionResponse = await helpers
			.httpRequest({
				method: 'POST',
				url: this.GRAPHQL_URL,
				headers: {
					Authorization: `Bearer ${accessToken}`,
					'x-pbp-clienttype': 'WebApp',
					'Content-Type': 'application/json',
				},
				body: {
					operationName: null,
					variables: { input: { request: { quoteId } } },
					query: QUERIES.START_PARKING_SESSION,
				},
			})
			.catch(this.handleGraphQLError.bind(this));

		const session = sessionResponse.data.startParkingSessionV1.parkingSessionResponse;

		// Step 2: Create a payment capture job linked to the session
		const jobResponse = await helpers
			.httpRequest({
				method: 'POST',
				url: this.GRAPHQL_URL,
				headers: {
					Authorization: `Bearer ${accessToken}`,
					'x-pbp-clienttype': 'WebApp',
					'Content-Type': 'application/json',
					'x-pbp-workflowid': session.parkingSessionId,
				},
				body: {
					operationName: null,
					variables: {
						input: {
							request: {
								paymentMethod: {
									paymentMethodType: 'PaymentAccount',
									paymentDetails: {
										$type: 'paymentAccount',
										paymentAccountId,
										cvv: null,
										clientBrowserDetails: {
											browserAcceptHeader: 'text/html',
											browserColorDepth: 30,
											browserJavaEnabled: false,
											browserLanguage: 'en-GB',
											browserScreenHeight: 1440,
											browserScreenWidth: 2560,
											browserTimeZone: 60,
											browserUserAgent:
												'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0',
											flag3D: 'Y',
											httpAccept: '*/*',
											httpUserAgent:
												'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0',
										},
									},
								},
								lineItems: [
									{
										productType: 'parking',
										productReferenceId: session.parkingSessionId,
										vendorId: '6201',
										endingTime: session.expireTime,
										isEarlyCapture: session.isEarlyCapture,
										amount: {
											value: session.segmentTotalCost.amount,
											isoCurrencyCode: session.segmentTotalCost.currency,
										},
										required: true,
										metadata: JSON.stringify({
											parkingSegmentId: session.metadata.parkingSegmentId,
										}),
									},
								],
							},
						},
					},
					query: QUERIES.CREATE_JOB,
				},
			})
			.catch(this.handleGraphQLError.bind(this));

		const job = this.removeGraphQLMetadata(jobResponse.data.createJobV1.createJobResponse);

		// Step 3: Wait for job processing, then retrieve the job status
		await sleep(5000); // PayByPhone requires time to process the payment job before it can be queried
		const statusResponse = await helpers
			.httpRequest({
				method: 'POST',
				url: this.GRAPHQL_URL,
				headers: {
					Authorization: `Bearer ${accessToken}`,
					'x-pbp-clienttype': 'WebApp',
					'Content-Type': 'application/json',
					'x-pbp-workflowid': session.parkingSessionId,
				},
				body: {
					operationName: null,
					variables: { jobId: job.jobId },
					query: QUERIES.GET_JOB,
				},
			})
			.catch(this.handleGraphQLError.bind(this));

		return this.removeGraphQLMetadata(statusResponse.data.getJobV1);
	}
}
