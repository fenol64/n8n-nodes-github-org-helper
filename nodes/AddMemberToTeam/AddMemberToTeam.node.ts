import {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeApiError,
} from 'n8n-workflow';

export class AddMemberToTeam implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Add Member to GitHub Team',
		name: 'addMemberToTeam',
		icon: 'file:github.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Add a member to a GitHub team',
		defaults: {
			name: 'Add Member to Team',
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
				displayName: 'Organization Name',
				name: 'organization',
				type: 'string',
				default: '',
				required: true,
				description: 'The organization name. The name is not case sensitive.',
			},
			{
				displayName: 'Team Slug',
				name: 'teamSlug',
				type: 'string',
				default: '',
				required: true,
				description: 'The slug of the team name (team name in lowercase with hyphens)',
			},
			{
				displayName: 'Username',
				name: 'username',
				type: 'string',
				default: '',
				required: true,
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
				description: 'The role to assign to the team member',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const organization = this.getNodeParameter('organization', i) as string;
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
