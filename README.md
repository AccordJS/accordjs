# My Bun Project

[![CI](https://github.com/AccordJS/accordjs/actions/workflows/ci.yml/badge.svg)](https://github.com/AccordJS/accordjs/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-1.0+-black.svg)](https://bun.sh/)

> A modern TypeScript project template built with Bun, featuring comprehensive tooling for development, testing, and deployment.

## Features

- ⚡ **Fast**: Powered by [Bun](https://bun.sh/) for lightning-fast package management and runtime
- 🔧 **TypeScript**: Full TypeScript support with strict configuration
- 🎨 **Code Quality**: [Biome](https://biomejs.dev/) for linting and formatting
- 🔒 **Git Hooks**: Pre-commit hooks with [Lefthook](https://github.com/evilmartians/lefthook)
- 📝 **Conventional Commits**: Enforced commit message format
- 🤖 **GitHub Actions**: Automated CI/CD with comprehensive testing
- 📦 **Dependabot**: Automatic dependency updates
- 🛡️ **Security**: Security policies and vulnerability scanning
- 📋 **Templates**: Issue and pull request templates
- 📚 **Documentation**: Comprehensive project documentation

## Quick Start

### Prerequisites

- [Bun](https://bun.sh/) >= 1.0.0
- [Git](https://git-scm.com/)

### Using This Template

1. **Click "Use this template"** on GitHub or clone the repository:
   ```bash
   git clone https://github.com/AccordJS/accordjs.git
   cd my-bun-project
   ```

2. **Update project information**:
   - [ ] Update `package.json` with your project details
   - [ ] Replace `angelxmoreno` in all files with your GitHub username
   - [ ] Update `angel@angelxmoreno.com` with your email
   - [ ] Replace `[Your Name]` in LICENSE with your name
   - [ ] Update this README with your project description

3. **Install dependencies**:
   ```bash
   bun install
   ```

4. **Start developing**:
   ```bash
   bun run dev
   ```

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start development server with hot reload |
| `bun run build` | Build the project for production |
| `bun test` | Run the test suite |
| `bun run typecheck` | Run TypeScript type checking |
| `bun run lint` | Lint code with Biome |
| `bun run lint:fix` | Fix linting issues automatically |
| `bun run check` | Run type checking and linting |

## Project Structure

```
├── .github/                 # GitHub templates and workflows
│   ├── ISSUE_TEMPLATE/     # Issue templates
│   ├── workflows/          # GitHub Actions workflows
│   ├── CODEOWNERS          # Code review assignments
│   ├── dependabot.yml      # Dependabot configuration
│   └── pull_request_template.md
├── src/                    # Source code
│   └── index.ts           # Main entry point
├── .commitlintrc.json     # Commit message linting
├── .gitignore             # Git ignore patterns
├── biome.json             # Biome configuration
├── lefthook.yml           # Git hooks configuration
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── CODE_OF_CONDUCT.md     # Code of conduct
├── CONTRIBUTING.md        # Contributing guidelines
├── LICENSE                # MIT license
├── README.md              # Project documentation
└── SECURITY.md            # Security policy
```

## Development

### Code Style

This project uses [Biome](https://biomejs.dev/) for both linting and formatting:

- **Formatting**: 4 spaces, single quotes, semicolons
- **Linting**: Recommended rules with TypeScript support
- **Import sorting**: Automatic import organization

### Git Hooks

Pre-commit hooks automatically run:
- TypeScript type checking
- Code linting
- Commit message validation

### Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

feat: add user authentication
fix: resolve memory leak in data processing
docs: update installation instructions
```

## Testing

```bash
# Run all tests
bun test

# Run tests with coverage
bun test --coverage

# Run tests in watch mode
bun test --watch
```

## Building

```bash
# Build for production
bun run build

# Type check only (no output)
bun run typecheck
```

## Contributing

Please read our [Contributing Guide](CONTRIBUTING.md) for details on:
- Development setup
- Code style guidelines
- Pull request process
- Code of conduct

## Security

If you discover a security vulnerability, please email [angel@angelxmoreno.com](mailto:angel@angelxmoreno.com).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Bun](https://bun.sh/) - Fast all-in-one JavaScript runtime
- [Biome](https://biomejs.dev/) - One toolchain for your web project
- [Lefthook](https://github.com/evilmartians/lefthook) - Fast and powerful Git hooks manager

---

**Happy coding! 🚀**