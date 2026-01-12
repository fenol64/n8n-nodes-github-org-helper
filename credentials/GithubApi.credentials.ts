import {
	IAuthenticateGeneric,
	ICredentialType,
	INodeProperties,
	Icon,
} from 'n8n-workflow';

export class GithubApi implements ICredentialType {
	name = 'GithubApi';
    icon = 'file:../icons/github.dark.svg' as Icon;
	displayName = 'GitHub API';
	documentationUrl = 'github';
	properties: INodeProperties[] = [
		{
			displayName: 'Authentication Method',
			name: 'authMethod',
			type: 'options',
			options: [
				{
					name: 'Personal Access Token',
					value: 'token',
				},
				{
					name: 'GitHub App',
					value: 'app',
				},
			],
			default: 'token',
		},
		{
			displayName: 'Access Token',
			name: 'accessToken',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			displayOptions: {
				show: {
					authMethod: ['token'],
				},
			},
			description: 'GitHub personal access token with appropriate permissions',
		},
		{
			displayName: 'App ID',
			name: 'appId',
			type: 'string',
			default: '',
			required: true,
			displayOptions: {
				show: {
					authMethod: ['app'],
				},
			},
			description: 'GitHub App ID',
		},
		{
			displayName: 'Installation ID',
			name: 'installationId',
			type: 'string',
			default: '',
			required: true,
			displayOptions: {
				show: {
					authMethod: ['app'],
				},
			},
			description: 'GitHub App Installation ID for your organization',
		},
		{
			displayName: 'Private Key',
			name: 'privateKey',
			type: 'string',
			typeOptions: {
				rows: 10,
			},
			default: '',
			required: true,
			displayOptions: {
				show: {
					authMethod: ['app'],
				},
			},
			description: 'GitHub App Private Key (PEM format) - Copy the entire content from the .pem file',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '={{$credentials.authMethod === "token" ? "Bearer " + $credentials.accessToken : ""}}',
			},
		},
	};
}
