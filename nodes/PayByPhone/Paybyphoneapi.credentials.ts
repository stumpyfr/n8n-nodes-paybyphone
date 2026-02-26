import { ICredentialTestRequest, ICredentialType, INodeProperties } from 'n8n-workflow';

export class Paybyphoneapi implements ICredentialType {
	name = 'PayByPhoneApi';
	displayName = 'PayByPhone';
	icon = 'file:logo.svg' as const;
	properties: INodeProperties[] = [
		{
			displayName: 'Mobile Number',
			name: 'mobileNumber',
			type: 'string',
			typeOptions: { password: false },
			placeholder: '+33612345678',
			description:
				'Your mobile number registered with PayByPhone, including the country code (e.g., +33612345678)',
			default: '',
		},
		{
			displayName: 'Password',
			name: 'password',
			type: 'string',
			typeOptions: { password: true },
			placeholder: 'Your PayByPhone password',
			description: 'Your password registered with PayByPhone',
			default: '',
		},
	];

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://auth.paybyphoneapis.com',
			url: '/token',
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'origin': 'https://m.paybyphone.com',
				'x-pbp-clienttype': 'WebApp',
			},
			body: "=grant_type=password&client_id=paybyphone_web&username={{encodeURIComponent($credentials.mobileNumber)}}&password={{$credentials.password}}",
		},
	};
}
