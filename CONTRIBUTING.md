# Contributing to AccordJS

Thank you for your interest in contributing to AccordJS! This guide will help you get started with contributing to our Discord bot framework.

## Development Setup

### Prerequisites

- [Bun](https://bun.sh) (latest version)
- Node.js 18+ (for compatibility testing)
- Git

### Getting Started

1. **Fork and Clone**
   ```bash
   git clone https://github.com/AccordJS/accordjs.git
   cd accordjs
   ```

2. **Install Dependencies**
   ```bash
   bun install
   ```

3. **Run the Development Server**
   ```bash
   bun run dev
   ```

## Development Workflow

### Code Quality

We use several tools to maintain code quality:

- **Biome** for linting and formatting
- **TypeScript** for type checking
- **Lefthook** for git hooks
- **Commitlint** for conventional commits

### Before Committing

Run the quality checks:

```bash
# Check TypeScript types and linting
bun run check

# Run tests
bun test

# Auto-fix formatting issues
bun run lint:fix
```

## Coding Standards

### File Naming Convention

AccordJS uses **kebab-case for all file names** to ensure consistency and cross-platform compatibility:

```bash
# ✅ Correct file naming
src/bus/in-memory-event-bus.ts # Contains InMemoryEventBus class
src/utils/create-logger.ts  # Contains createLogger function
src/bot/discord-client.ts   # Contains DiscordClient class

# ❌ Incorrect file naming
src/bus/eventBus.ts         # camelCase
src/utils/createLogger.ts   # camelCase
src/bot/DiscordClient.ts    # PascalCase
```

**Content naming inside files:**
- **Classes, Interfaces, Types**: `PascalCase` (InMemoryEventBus, EventBus, EventMap)
- **Functions, Variables**: `camelCase` (createLogger, defineConfig)
- **Constants**: `UPPER_CASE` (MAX_RETRIES, DEFAULT_CONFIG)
- **Zod Schemas**: `PascalCase + Schema` suffix (ConfigSchema, EventTypeSchema)

### Git Hooks

This project uses Lefthook to automatically run quality checks:

- **Pre-commit**: Runs linting and type checking
- **Commit-msg**: Validates commit message format

## Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer(s)]
```

### Types

- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code changes that neither fix bugs nor add features
- `test`: Adding or updating tests
- `chore`: Changes to build process, dependencies, etc.

### Examples

```bash
git commit -m "feat: add user authentication"
git commit -m "fix: resolve memory leak in data processing"
git commit -m "docs: update installation instructions"
```

## Pull Request Process

1. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Your Changes**
   - Write your code
   - Add tests if applicable
   - Update documentation

3. **Test Your Changes**
   ```bash
   bun run check
   bun test
   ```

4. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "feat: your descriptive commit message"
   ```

5. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

### PR Guidelines

- **Title**: Use conventional commit format
- **Description**: Explain what you changed and why
- **Testing**: Describe how you tested your changes
- **Documentation**: Update docs if needed

## AccordJS Architecture

AccordJS follows a clean, event-driven architecture. Understanding this structure will help you contribute effectively:

### Core Principles
- **Discord Client Isolation**: Discord.js objects stay in the gateway layer
- **Event Normalization**: Discord events are transformed into internal types
- **Type Safety**: Zero `any` usage with strict TypeScript
- **Plugin Architecture**: Features implemented as independent plugins

### Project Structure

```
src/
├── bot/                    # Discord gateway layer
│   ├── client.ts          # Discord client initialization
│   ├── gateway.ts         # Event normalization
│   └── intents.ts         # Discord intents
├── bus/                   # Event distribution
│   └── event-bus.ts       # Typed event bus
├── events/                # Event types and normalization
│   ├── normalizeMessage.ts
│   ├── normalizeMember.ts
│   └── types.ts
├── plugins/               # Plugin implementations
│   ├── commands/         # Command handling
│   ├── logging/          # Event logging
│   └── analytics/        # Analytics processing
├── services/             # External integrations
│   ├── database.ts
│   └── redis.ts
├── types/                # Core framework types
│   └── events.ts
└── index.ts              # Main entry point
```

### Contributing to Plugins

When adding new plugins:
1. Subscribe to events via the event bus
2. Use normalized event types, not Discord.js objects
3. Follow the existing plugin patterns
4. Add proper TypeScript types

## Scripts

| Script | Description |
|--------|-------------|
| `bun run dev` | Start development server with hot reload |
| `bun run build` | Build the project |
| `bun run test` | Run tests |
| `bun run typecheck` | Type check without emitting |
| `bun run lint` | Lint code |
| `bun run lint:fix` | Fix linting issues |
| `bun run check` | Run type check and linting |

## Need Help?

- 📝 Check existing [issues](https://github.com/AccordJS/accordjs/issues)
- 💬 Start a [discussion](https://github.com/AccordJS/accordjs/discussions)
- 📧 Contact maintainers: [angel@angelxmoreno.com](mailto:angel@angelxmoreno.com)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.