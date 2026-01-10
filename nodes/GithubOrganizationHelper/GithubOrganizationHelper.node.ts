import {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeApiError,
} from 'n8n-workflow';

export class GithubOrganizationHelper implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'GitHub Organization Helper',
		name: 'githubOrganizationHelper',
		icon: 'file:github.dark.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["resource"] + ": " + $parameter["operation"]}}',
		description: 'Manage GitHub organizations, teams, projects and members',
		defaults: {
			name: 'GitHub Organization Helper',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'GithubApi',
				required: true,
			},
		],
		requestDefaults: {
			baseURL: 'https://api.github.com',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Team',
						value: 'team',
					},
					{
						name: 'Project',
						value: 'project',
					},
					{
						name: 'Team Member',
						value: 'teamMember',
					},
				],
				default: 'team',
			},
			// Team Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['team'],
					},
				},
				options: [
					{
						name: 'Create',
						value: 'create',
						description: 'Create a new team',
						action: 'Create a team',
					},
				],
				default: 'create',
			},
			// Project Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['project'],
					},
				},
				options: [
					{
						name: 'Create',
						value: 'create',
						description: 'Create a new project',
						action: 'Create a project',
					},
				],
				default: 'create',
			},
			// Team Member Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['teamMember'],
					},
				},
				options: [
					{
						name: 'Add',
						value: 'add',
						description: 'Add a member to a team',
						action: 'Add a member to team',
					},
				],
				default: 'add',
			},
			// Organization Name (common field)
			{
				displayName: 'Organization Name',
				name: 'organization',
				type: 'string',
				default: '',
				required: true,
				description: 'The organization name. The name is not case sensitive.',
			},
			// Team Fields
			{
				displayName: 'Team Name',
				name: 'teamName',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['team'],
						operation: ['create'],
					},
				},
				description: 'The name of the team',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						resource: ['team'],
						operation: ['create'],
					},
				},
				description: 'A description of the team',
			},
			{
				displayName: 'Privacy',
				name: 'privacy',
				type: 'options',
				options: [
					{
						name: 'Secret',
						value: 'secret',
						description: 'Only visible to organization owners and members of the team',
					},
					{
						name: 'Closed',
						value: 'closed',
						description: 'Visible to all members of the organization',
					},
				],
				default: 'closed',
				displayOptions: {
					show: {
						resource: ['team'],
						operation: ['create'],
					},
				},
				description: 'The level of privacy this team should have',
			},
			// Project Fields
			{
				displayName: 'Project Name',
				name: 'projectName',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['project'],
						operation: ['create'],
					},
				},
				description: 'The name of the project',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						resource: ['project'],
						operation: ['create'],
					},
				},
				description: 'A description of the project',
			},
			// Team Member Fields
			{
				displayName: 'Team Slug',
				name: 'teamSlug',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['teamMember'],
						operation: ['add'],
					},
				},
				description: 'The slug of the team name (team name in lowercase with hyphens)',
			},
			{
				displayName: 'Username',
				name: 'username',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['teamMember'],
						operation: ['add'],
					},
				},
				description: 'The GitHub username to add to the team',
			},
			{
				displayName: 'Role',
				name: 'role',
				type: 'options',
				options: [
					{
						name: 'Member',
						value: 'member',
						description: 'A normal member of the team',
					},
					{
						name: 'Maintainer',
						value: 'maintainer',
						description: 'A team maintainer has permission to add and remove team members',
					},
				],
				default: 'member',
				displayOptions: {
					show: {
						resource: ['teamMember'],
						operation: ['add'],
					},
				},
				description: 'The role to assign to the team member',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				const organization = this.getNodeParameter('organization', i) as string;

				if (resource === 'team') {
					if (operation === 'create') {
						const teamName = this.getNodeParameter('teamName', i) as string;
						const description = this.getNodeParameter('description', i, '') as string;
						const privacy = this.getNodeParameter('privacy', i) as string;

						const body: IDataObject = {
							name: teamName,
							description,
							privacy,
						};

						const response = await this.helpers.requestWithAuthentication.call(
							this,
							'GithubApi',
							{
								method: 'POST',
								url: `https://api.github.com/orgs/${organization}/teams`,
								body,
								json: true,
							},
						);

						returnData.push({ json: response });
					}
				} else if (resource === 'project') {
					if (operation === 'create') {
						const projectName = this.getNodeParameter('projectName', i) as string;
						const description = this.getNodeParameter('description', i, '') as string;

						const body: IDataObject = {
							name: projectName,
						};

						if (description) {
							body.body = description;
						}

						const response = await this.helpers.requestWithAuthentication.call(
							this,
							'GithubApi',
							{
								method: 'POST',
								url: `https://api.github.com/orgs/${organization}/projects`,
								body,
								json: true,
								headers: {
									Accept: 'application/vnd.github+json',
								},
							},
						);

						returnData.push({ json: response });
					}
				} else if (resource === 'teamMember') {
					if (operation === 'add') {
						const teamSlug = this.getNodeParameter('teamSlug', i) as string;
						const username = this.getNodeParameter('username', i) as string;
						const role = this.getNodeParameter('role', i) as string;

						const body: IDataObject = {
							role,
						};

						const response = await this.helpers.requestWithAuthentication.call(
							this,
							'GithubApi',
							{
								method: 'PUT',
								url: `https://api.github.com/orgs/${organization}/teams/${teamSlug}/memberships/${username}`,
								body,
								json: true,
							},
						);

						returnData.push({ json: response });
					}
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: error.message } });
					continue;
				}
				throw new NodeApiError(this.getNode(), error);
			}
		}

		return [returnData];
	}
}
