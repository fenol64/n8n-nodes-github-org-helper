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
					{
						name: 'Create for Team',
						value: 'createForTeam',
						description: 'Create a new project for a specific team',
						action: 'Create a project for team',
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
						operation: ['create', 'createForTeam'],
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
						operation: ['create', 'createForTeam'],
					},
				},
				description: 'A description of the project',
			},
			{
				displayName: 'Team Slug',
				name: 'teamSlug',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['project'],
						operation: ['createForTeam'],
					},
				},
				description: 'The slug of the team (team name in lowercase with hyphens)',
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
						// Note: description parameter exists but cannot be set via GitHub API for Projects V2

						// First, get the organization ID using GraphQL
						const orgQuery = `
							query($login: String!) {
								organization(login: $login) {
									id
								}
							}
						`;

						const orgResponse = await this.helpers.requestWithAuthentication.call(
							this,
							'GithubApi',
							{
								method: 'POST',
								url: 'https://api.github.com/graphql',
								body: {
									query: orgQuery,
									variables: { login: organization },
								},
								json: true,
							},
						) as any;

						if (orgResponse.errors) {
							throw new Error(`GitHub GraphQL Error: ${JSON.stringify(orgResponse.errors)}`);
						}

						if (!orgResponse.data?.organization?.id) {
							throw new Error(`Organization '${organization}' not found or you don't have access to it`);
						}

						const ownerId = orgResponse.data.organization.id;

						// Create project using GraphQL (Projects V2)
						const mutation = `
							mutation($input: CreateProjectV2Input!) {
								createProjectV2(input: $input) {
									projectV2 {
										id
										title
										url
										number
									}
								}
							}
						`;

						const response = await this.helpers.requestWithAuthentication.call(
							this,
							'GithubApi',
							{
								method: 'POST',
								url: 'https://api.github.com/graphql',
								body: {
									query: mutation,
									variables: {
										input: {
											ownerId,
											title: projectName,
										},
									},
								},
								json: true,
							},
						) as any;

						if (response.errors) {
							throw new Error(`GitHub GraphQL Error: ${JSON.stringify(response.errors)}`);
						}

						if (!response.data?.createProjectV2?.projectV2) {
							throw new Error('Failed to create project. Please ensure your GitHub token has "project" permissions.');
						}

						returnData.push({ json: response.data.createProjectV2.projectV2 });
					} else if (operation === 'createForTeam') {
						const projectName = this.getNodeParameter('projectName', i) as string;
						const description = this.getNodeParameter('description', i, '') as string;
						const teamSlug = this.getNodeParameter('teamSlug', i) as string;

						// Get organization ID and team ID
						const orgAndTeamQuery = `
							query($orgLogin: String!, $teamSlug: String!) {
								organization(login: $orgLogin) {
									id
									team(slug: $teamSlug) {
										id
									}
								}
							}
						`;

						const orgTeamResponse = await this.helpers.requestWithAuthentication.call(
							this,
							'GithubApi',
							{
								method: 'POST',
								url: 'https://api.github.com/graphql',
								body: {
									query: orgAndTeamQuery,
									variables: {
										orgLogin: organization,
										teamSlug: teamSlug
									},
								},
								json: true,
							},
						) as any;

						if (orgTeamResponse.errors) {
							throw new Error(`GitHub GraphQL Error: ${JSON.stringify(orgTeamResponse.errors)}`);
						}

						if (!orgTeamResponse.data?.organization?.id) {
							throw new Error(`Organization '${organization}' not found or you don't have access to it`);
						}

						if (!orgTeamResponse.data?.organization?.team?.id) {
							throw new Error(`Team '${teamSlug}' not found in organization '${organization}'`);
						}

						const ownerId = orgTeamResponse.data.organization.id;
						const teamId = orgTeamResponse.data.organization.team.id;

						// Create organization project using GraphQL (Projects V2)
						const createProjectMutation = `
							mutation($input: CreateProjectV2Input!) {
								createProjectV2(input: $input) {
									projectV2 {
										id
										title
										url
										number
									}
								}
							}
						`;

						const createResponse = await this.helpers.requestWithAuthentication.call(
							this,
							'GithubApi',
							{
								method: 'POST',
								url: 'https://api.github.com/graphql',
								body: {
									query: createProjectMutation,
									variables: {
										input: {
											ownerId,
											title: projectName,
										},
									},
								},
								json: true,
							},
						) as any;

						if (createResponse.errors) {
							throw new Error(`GitHub GraphQL Error: ${JSON.stringify(createResponse.errors)}`);
						}

						if (!createResponse.data?.createProjectV2?.projectV2) {
							throw new Error('Failed to create project. Please ensure your GitHub token has "project" permissions.');
						}

						const projectId = createResponse.data.createProjectV2.projectV2.id;

						// Link project to team
						const linkToTeamMutation = `
							mutation($projectId: ID!, $teamId: ID!) {
								linkProjectV2ToTeam(input: { projectId: $projectId, teamId: $teamId }) {
									project {
										id
										title
										url
										number
									}
								}
							}
						`;

						const linkResponse = await this.helpers.requestWithAuthentication.call(
							this,
							'GithubApi',
							{
								method: 'POST',
								url: 'https://api.github.com/graphql',
								body: {
									query: linkToTeamMutation,
									variables: {
										projectId,
										teamId,
									},
								},
								json: true,
							},
						) as any;

						if (linkResponse.errors) {
							// Project was created but linking failed
							const result = createResponse.data.createProjectV2.projectV2;
							result.warning = `Project created but failed to link to team: ${JSON.stringify(linkResponse.errors)}`;
							returnData.push({ json: result });
						} else {
							const result = linkResponse.data.linkProjectV2ToTeam.project;
							result.success = `Project created and linked to team '${teamSlug}'`;
							if (description) {
								result.description_note = `Note: Description "${description}" cannot be set via API. Please add it manually in GitHub.`;
							}
							returnData.push({ json: result });
						}
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
