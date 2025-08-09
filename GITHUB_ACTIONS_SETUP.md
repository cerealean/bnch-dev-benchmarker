# GitHub Actions Setup

This repository includes a comprehensive CI/CD pipeline that automatically tests, builds, and publishes the library to npm.

## Required GitHub Secrets

To enable automatic publishing, you need to set up the following secrets in your GitHub repository:

### 1. NPM_TOKEN

1. Go to [npmjs.com](https://www.npmjs.com/) and sign in to your account
2. Click on your profile picture → "Access Tokens"
3. Click "Generate New Token" → "Granular Access Token"
4. Configure the token:
   - **Name**: `github-actions-bnch-benchmarker`
   - **Expiration**: Choose your preferred duration
   - **Package and organization scope**: Select your organization/account
   - **Packages**: Select this specific package or "All packages"
   - **Permissions**: Set "Read and write" for packages
5. Copy the generated token
6. In your GitHub repository, go to Settings → Secrets and variables → Actions
7. Click "New repository secret"
8. Name: `NPM_TOKEN`
9. Value: Paste the npm token

### 2. GITHUB_TOKEN

This is automatically provided by GitHub Actions, no setup required.

## Workflow Overview

The GitHub Actions workflow includes:

### **Test Job**

- Runs on Node.js versions 18.x, 20.x, and 22.x
- Installs dependencies
- Runs linter (`npm run lint`)
- Runs type checking (`npm run type-check`)
- Runs unit tests (`npm test`)
- Runs acceptance tests (`npm run test:acceptance`)

### **Build Job**

- Runs after tests pass
- Builds the library (`npm run build`)
- Uploads build artifacts

### **Publish Job**

- Runs only on GitHub releases
- Publishes to npm registry
- Makes the package available for installation

### **Semantic Release Job**

- Runs on pushes to main branch
- Automatically determines version based on commit messages
- Creates GitHub releases
- Updates CHANGELOG.md

## Triggering a Release

The workflow supports two release methods:

### Manual Release (Recommended for first release)

1. Create a GitHub release manually:
   - Go to your repository → Releases → "Create a new release"
   - Tag version: `v1.0.0` (or appropriate version)
   - Release title: `v1.0.0`
   - Describe the release
   - Click "Publish release"

### Automatic Release (Using Semantic Versioning)

Use conventional commit messages:

- `feat:` - New features (minor version bump)
- `fix:` - Bug fixes (patch version bump)
- `feat!:` or `fix!:` - Breaking changes (major version bump)

Examples:

```bash
git commit -m "feat: add new benchmark configuration options"
git commit -m "fix: resolve memory leak in worker isolation"
git commit -m "feat!: change API to use async/await pattern"
```

## Installing the Package

Once published, your Angular application can install the package:

```bash
npm install @bnch/benchmarker
```

## Using in Angular

In your Angular application:

```typescript
import { Benchmarker, BenchmarkConfiguration } from '@bnch/benchmarker';

// Create benchmarker instance
const benchmarker = new Benchmarker();

// Configure your benchmark
const config: BenchmarkConfiguration = {
  name: 'Array Processing',
  code: `
    const arr = Array.from({length: 1000}, (_, i) => i);
    const result = arr.map(x => x * 2).filter(x => x > 500);
  `,
  iterations: 1000,
  warmupIterations: 100,
};

// Run benchmark
benchmarker.run(config).then((result) => {
  console.log('Benchmark completed:', result);
});
```

## Monitoring Builds

- **Pull Requests**: Tests run automatically, showing status checks
- **Main Branch**: Full CI/CD pipeline runs, including potential releases
- **Releases**: Package is built, tested, and published to npm

You can monitor the progress in the "Actions" tab of your GitHub repository.
