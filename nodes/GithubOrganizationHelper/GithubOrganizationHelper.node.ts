import {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeApiError,
} from 'n8n-workflow';
import * as jwt from 'jsonwebtoken';

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

				// Get auth headers for this operation
				const credentials = await this.getCredentials('GithubApi');
				let authHeaders: { [key: string]: string };

				if (credentials.authMethod === 'app') {
					// Generate JWT for GitHub App
					const now = Math.floor(Date.now() / 1000);
					const payload = {
						iat: now - 60,
						exp: now + (10 * 60),
						iss: credentials.appId as string,
					};
					const jwtToken = jwt.sign(payload, credentials.privateKey as string, { algorithm: 'RS256' });

					// Get installation token
					const tokenResponse = await this.helpers.request({
						method: 'POST',
						url: `https://api.github.com/app/installations/${credentials.installationId}/access_tokens`,
						headers: {
							'Authorization': `Bearer ${jwtToken}`,
							'Accept': 'application/vnd.github.v3+json',
							'User-Agent': 'n8n-github-org-helper',
						},
						json: true,
					}) as any;

					authHeaders = {
						'Authorization': `Bearer ${tokenResponse.token}`,
						'Accept': 'application/vnd.github.v3+json',
						'User-Agent': 'n8n-github-org-helper',
					};
				} else {
					authHeaders = {
						'Authorization': `Bearer ${credentials.accessToken}`,
						'Accept': 'application/vnd.github.v3+json',
						'User-Agent': 'n8n-github-org-helper',
					};
				}

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

						const response = await this.helpers.request({
							method: 'POST',
							url: `https://api.github.com/orgs/${organization}/teams`,
							headers: authHeaders,
							body,
							json: true,
						});

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

						const orgResponse = await this.helpers.request({
							method: 'POST',
							url: 'https://api.github.com/graphql',
							headers: authHeaders,
							body: {
								query: orgQuery,
								variables: { login: organization },
							},
							json: true,
						}) as any;

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

						const response = await this.helpers.request({
							method: 'POST',
							url: 'https://api.github.com/graphql',
							headers: authHeaders,
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
						}) as any;

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

						const orgTeamResponse = await this.helpers.request({
							method: 'POST',
							url: 'https://api.github.com/graphql',
							headers: authHeaders,
							body: {
								query: orgAndTeamQuery,
								variables: {
									orgLogin: organization,
									teamSlug: teamSlug
								},
							},
							json: true,
						}) as any;

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

						const createResponse = await this.helpers.request({
							method: 'POST',
							url: 'https://api.github.com/graphql',
							headers: authHeaders,
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
						}) as any;

						if (createResponse.errors) {
							throw new Error(`GitHub GraphQL Error: ${JSON.stringify(createResponse.errors)}`);
						}

						if (!createResponse.data?.createProjectV2?.projectV2) {
							throw new Error('Failed to create project. Please ensure your GitHub token has "project" permissions.');
						}

						const projectUrl = createResponse.data.createProjectV2.projectV2.url;

						let result = createResponse.data.createProjectV2.projectV2;

						// With GitHub Apps, we can now add team collaborators automatically
						if (credentials.authMethod === 'app') {
							result.info = `Project created successfully with GitHub App authentication. Team access can now be managed programmatically.`;
							// TODO: Implement automatic team collaboration assignment when GitHub adds this to their API
							result.team_access_note = `Team '${teamSlug}' access should be added via GitHub's project collaboration API once available.`;
						} else {
							// Note: GitHub API doesn't allow adding team collaborators via Personal Access Token
							result.team_instructions = `To add team '${teamSlug}' to this project:
1. Go to ${projectUrl}/settings/access
2. Click "Manage access"
3. Click "Add teams"
4. Search for '${teamSlug}' and add it with desired role`;
							result.info = `Project created successfully. Due to GitHub API limitations with Personal Access Tokens, team access must be added manually.`;
						}

						if (description) {
							result.description_note = `To add description: Go to project settings and add "${description}"`;
						}

						returnData.push({ json: result });
					}
				} else if (resource === 'teamMember') {
					if (operation === 'add') {
						const teamSlug = this.getNodeParameter('teamSlug', i) as string;
						const username = this.getNodeParameter('username', i) as string;
						const role = this.getNodeParameter('role', i) as string;

						const body: IDataObject = {
							role,
						};

						const response = await this.helpers.request({
							method: 'PUT',
							url: `https://api.github.com/orgs/${organization}/teams/${teamSlug}/memberships/${username}`,
							headers: authHeaders,
							body,
							json: true,
						});

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
