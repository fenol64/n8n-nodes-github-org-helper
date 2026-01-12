# n8n-nodes-github-org-helper

This is an n8n community node that helps you manage GitHub organizations, teams, projects, and members directly from your n8n workflows.

[![npm version](https://badge.fury.io/js/n8n-nodes-github-org-helper.svg)](https://badge.fury.io/js/n8n-nodes-github-org-helper)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

## Features

This node provides comprehensive GitHub organization management capabilities:

### 🏢 Team Management
- **Create Teams**: Create new teams in your GitHub organization with custom privacy settings
- Configure team privacy (Secret or Closed)
- Add descriptions to teams

### 📋 Project Management (GitHub Projects V2)
- **Create Projects**: Create organization-level projects
- **Create Projects for Teams**: Create projects and automatically assign them to specific teams
- **Automatic Team Linking**: When using GitHub App authentication, teams are automatically added to projects with the correct permissions
- Support for GraphQL-based Projects V2

### 👥 Team Member Management
- **Add Members to Teams**: Add GitHub users to teams with specific roles
- Assign roles: Member or Maintainer
- Manage team membership programmatically

## Authentication

This node supports two authentication methods:

### 1. Personal Access Token (Classic)
Simple authentication using a GitHub Personal Access Token.

**Required Scopes:**
- `repo` (Full control of private repositories)
- `admin:org` (Full control of orgs and teams)
- `project` (Full control of projects)

### 2. GitHub App (Recommended) ✨
More secure and powerful authentication using a GitHub App.

**Benefits:**
- More granular permissions
- Better security with short-lived tokens
- **Automatic team collaboration**: Projects are automatically linked to teams
- Organization-wide installation

**Required Permissions:**
- **Repository permissions:**
  - Administration: Read and write
  - Contents: Read and write
- **Organization permissions:**
  - Members: Read and write
  - Administration: Read and write
  - Projects: Read and write

**Setup:**
1. Create a GitHub App in your organization
2. Generate and download the Private Key (.pem file)
3. Install the app in your organization
4. Get the App ID and Installation ID
5. Configure the credentials in n8n with:
   - App ID
   - Installation ID
   - Private Key (full PEM content)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

### Using npm

```bash
npm install n8n-nodes-github-org-helper
```

### Manual Installation

1. Navigate to your n8n installation directory
2. Run: `npm install n8n-nodes-github-org-helper`
3. Restart n8n

## Operations

### Team Resource

#### Create Team
Creates a new team in your GitHub organization.

**Parameters:**
- `Organization Name` (required): The organization name
- `Team Name` (required): Name of the team to create
- `Description` (optional): Team description
- `Privacy` (required): Team privacy level
  - `Secret`: Only visible to organization owners and team members
  - `Closed`: Visible to all organization members

**Example Output:**
```json
{
  "id": 12345678,
  "name": "Engineering Team",
  "slug": "engineering-team",
  "description": "Our amazing engineering team",
  "privacy": "closed",
  "url": "https://api.github.com/organizations/123/team/12345678"
}
```

### Project Resource

#### Create Project
Creates a new organization-level project (Projects V2).

**Parameters:**
- `Organization Name` (required): The organization name
- `Project Name` (required): Name of the project

**Example Output:**
```json
{
  "id": "PVT_kwDODu0xFM4BMdll",
  "title": "Q1 Roadmap",
  "url": "https://github.com/orgs/YourOrg/projects/1",
  "number": 1
}
```

#### Create Project for Team
Creates a new project and automatically links it to a specific team.

**Parameters:**
- `Organization Name` (required): The organization name
- `Project Name` (required): Name of the project
- `Team Slug` (required): Team slug (lowercase team name with hyphens)
- `Description` (optional): Project description note

**Features:**
- ✨ **Automatic team linking** when using GitHub App authentication
- Team members get immediate access to the project
- Fallback to manual instructions if linking fails

**Example Output:**
```json
{
  "id": "PVT_kwDODu0xFM4BMdll",
  "title": "Mobile App Redesign",
  "url": "https://github.com/orgs/YourOrg/projects/2",
  "number": 2,
  "info": "Project created successfully and team 'mobile-team' has been automatically added with access!",
  "team_linked": true
}
```

### Team Member Resource

#### Add Team Member
Adds a GitHub user to a team with a specific role.

**Parameters:**
- `Organization Name` (required): The organization name
- `Team Slug` (required): Team slug (lowercase team name with hyphens)
- `Username` (required): GitHub username to add
- `Role` (required): Member role
  - `Member`: Normal team member
  - `Maintainer`: Can add/remove team members

**Example Output:**
```json
{
  "url": "https://api.github.com/orgs/YourOrg/teams/engineering-team/memberships/username",
  "role": "member",
  "state": "active"
}
```

## Usage Examples

### Example 1: Automated Team Onboarding

Create a workflow that automatically:
1. Creates a new team when a project starts
2. Creates a project for that team
3. Adds team members

```
Webhook (New Project)
  → GitHub Org Helper (Create Team)
  → GitHub Org Helper (Create Project for Team)
  → Split In Batches (Team Members)
  → GitHub Org Helper (Add Team Member)
```

### Example 2: Quarterly Project Setup

Automatically create quarterly projects for all teams:

```
Schedule (Quarterly)
  → Code (Generate Project Name)
  → GitHub Org Helper (Create Project for Team)
  → Slack (Notify Team)
```

### Example 3: Sync Teams from External Source

Sync team structure from your HR system or database:

```
Database (Get Teams)
  → GitHub Org Helper (Create Team)
  → Database (Get Team Members)
  → GitHub Org Helper (Add Team Member)
```

## Tips & Best Practices

### Finding Team Slugs

Team slugs are lowercase versions of team names with spaces replaced by hyphens:
- "Engineering Team" → `engineering-team`
- "Mobile Squad Labs" → `mobile-squad-labs`
- "DevOps-Team" → `devops-team`

### GitHub App vs Personal Access Token

| Feature | Personal Access Token | GitHub App |
|---------|----------------------|------------|
| Setup Complexity | ⭐ Simple | ⭐⭐ Moderate |
| Security | ⭐⭐ Good | ⭐⭐⭐ Excellent |
| Token Lifetime | Long-lived | Short-lived (1 hour) |
| Automatic Team Linking | ❌ No | ✅ Yes |
| Recommended for | Testing, Personal Use | Production, Organizations |

### Error Handling

Enable "Continue On Fail" in the node settings to handle errors gracefully:
- Projects may be created even if team linking fails
- The node provides manual instructions as fallback
- Detailed error messages help troubleshoot issues

## Troubleshooting

### "Team not found" Error
- Verify the team slug is correct (lowercase with hyphens)
- Ensure your credentials have access to the organization
- Check that the team exists in the organization

### "Failed to create project" Error
- Verify your token/app has `project` permissions
- Ensure the organization name is correct
- Check that you have admin access to the organization

### "Authentication failed" Error (GitHub App)
- Verify App ID is correct
- Ensure Installation ID matches your organization
- Check that the Private Key is complete (includes BEGIN/END lines)
- Confirm the app is installed in your organization

### Team Linking Fails
- Check that the GitHub App has "Projects" write permission
- Verify the team slug is correct
- The project is still created; you can add the team manually using the provided instructions

## Compatibility

- **n8n version**: 0.228.0 or later
- **Node version**: 18.x or later
- **GitHub API**: REST API v3 and GraphQL API v4

## Resources

- [n8n Community Nodes Documentation](https://docs.n8n.io/integrations/community-nodes/)
- [GitHub REST API Documentation](https://docs.github.com/en/rest)
- [GitHub GraphQL API Documentation](https://docs.github.com/en/graphql)
- [GitHub Apps Documentation](https://docs.github.com/en/apps)

## Development

### Building the node

```bash
npm install
npm run build
```

### Testing locally

```bash
npm run dev
```

Link to your local n8n installation:
```bash
cd ~/.n8n/nodes
npm link n8n-nodes-github-org-helper
```

## License

[MIT](LICENSE.md)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Author

**Fernando Nascimento Oliveira**
- Email: fenol64.dev@gmail.com
- GitHub: [@fenol64](https://github.com/fenol64)

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a detailed history of changes.

## Support

If you encounter any issues or have questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Search for existing [issues](https://github.com/fenol64/n8n-nodes-github-org-helper/issues)
3. Create a new issue with detailed information

---

Made with ❤️ for the n8n community
