import {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeApiError,
} from 'n8n-workflow';

export class CreateGithubTeam implements INodeType {
	description: INodeTypeDescription = {
		    displayName: 'Create github organization team',
            name: 'createGithubTeam',
            icon: 'file:github.svg',
            group: ['transform'],
            version: 1,
            subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
            description: 'Create a team within a GitHub organization',
            defaults: {
                name: 'Create GitHub Team',
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
                    displayName: 'Organization name',
                    name: 'organization',
                    type: 'string',
                    default: '',
                    required: true,
                    description: 'The organization name. The name is not case sensitive.',
                },
                {
                    displayName: 'Team Name',
                    name: 'teamName',
                    type: 'string',
                    default: '',
                    required: true,
                    description: 'The name of the team.',
                },
                {
                    displayName: 'Description',
                    name: 'description',
                    type: 'string',
                    default: '',
                    description: 'A description of the team.',
                },
                {
                    displayName: 'Privacy',
                    name: 'privacy',
                    type: 'options',
                    options: [
                        {
                            name: 'Secret',
                            value: 'secret',
                            description: 'A team with a privacy level of secret is only visible to organization owners and members of the team.',
                        },
                        {
                            name: 'Visible',
                            value: 'closed',
                            description: 'A team with a privacy level of visible is visible to all members of the organization.',
                        }
                    ],
                    default: 'closed',
                    description: 'The level of privacy this team should have.',
                },
		]
	};

	// Execute the node logic
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const organization = this.getNodeParameter('organization', i) as string;
				const teamName = this.getNodeParameter('teamName', i) as string;
				const description = this.getNodeParameter('description', i, '') as string;
				const privacy = this.getNodeParameter('privacy', i) as string;

				const body: IDataObject = {
					name: teamName,
					description,
					privacy,
				};

				const response = await this.helpers.requestWithAuthentication.call(this, 'githubApi', {
					method: 'POST',
					url: `https://api.github.com/orgs/${organization}/teams`,
					body,
					json: true,
				});

				returnData.push({ json: response });
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: error.message } });
					continue;
				}
				throw new NodeApiError(this.getNode(), error);
			}
		}

		return this.prepareOutputData(returnData);
	}
}