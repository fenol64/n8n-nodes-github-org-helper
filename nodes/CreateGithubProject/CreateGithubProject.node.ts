import {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeApiError,
} from 'n8n-workflow';

export class CreateGithubProject implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Create GitHub Organization Project',
		name: 'createGithubProject',
		icon: 'file:github.dark.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Create a project in a GitHub organization',
		defaults: {
			name: 'Create GitHub Project',
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
				Accept: 'application/vnd.github+json',
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
				displayName: 'Project Name',
				name: 'projectName',
				type: 'string',
				default: '',
				required: true,
				description: 'The name of the project.',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				description: 'A description of the project.',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const organization = this.getNodeParameter('organization', i) as string;
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
