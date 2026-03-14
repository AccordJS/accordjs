# AccordJS

[![CI](https://github.com/AccordJS/accordjs/actions/workflows/ci.yml/badge.svg)](https://github.com/AccordJS/accordjs/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-1.0+-black.svg)](https://bun.sh/)

> A clean, extensible Discord bot framework in TypeScript focused on event ingestion, analytics, and plugin architecture with complete type safety.

## Features

### Discord Bot Framework
- 🤖 **Event-Driven Architecture**: Discord gateway isolation with normalized event processing
- 🔌 **Plugin System**: Extensible plugin architecture for modular feature development
- 📡 **Typed Event Bus**: Fully typed event distribution system with compile-time safety
- ⚡ **Command Router**: Centralized command handling with permission checks and cooldowns
- 🛡️ **Type Safety**: Zero `any` usage with strict TypeScript configuration and Zod runtime validation
- 📊 **Analytics Ready**: Built-in support for event logging and analytics processing

### Development Experience
- ⚡ **Fast**: Powered by [Bun](https://bun.sh/) for lightning-fast package management and runtime
- 🔧 **TypeScript**: Full TypeScript support with strict configuration
- 🎨 **Code Quality**: [Biome](https://biomejs.dev/) for linting and formatting
- 🔒 **Git Hooks**: Pre-commit hooks with [Lefthook](https://github.com/evilmartians/lefthook)
- 📝 **Conventional Commits**: Enforced commit message format
- 🤖 **GitHub Actions**: Automated CI/CD with comprehensive testing

## Quick Start

### Prerequisites

- [Bun](https://bun.sh/) >= 1.0.0
- [Git](https://git-scm.com/)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/AccordJS/accordjs.git
   cd accordjs
   ```

2. **Install dependencies**:
   ```bash
   bun install
   ```

3. **Start developing**:
   ```bash
   bun run dev
   ```

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start development server with hot reload |
| `bun run build` | Build the project for production |
| `bun test` | Run the test suite |
| `bun run check-types` | Run TypeScript type checking |
| `bun run lint` | Lint code with Biome |
| `bun run lint:fix` | Fix linting issues automatically |
| `bun run check-dups` | Check for code duplication |
| `bun run check` | Run all checks (types, lint, duplicates) |

## Architecture

AccordJS follows a clean, event-driven architecture with these core principles:

### 1. Discord Client Isolation
The Discord client exists only in the gateway layer, preventing Discord-specific objects from leaking into application logic.

### 2. Event Normalization
Discord events are transformed into internal event types using Zod schemas for framework independence and runtime validation.

### 3. Typed Event Bus
A fully typed event distribution system ensures compile-time safety and eliminates runtime errors.

### 4. Plugin Architecture
Features are implemented as plugins that subscribe to events via the event bus, enabling modular development.

## Project Structure

```
src/
├── bot/                    # Discord gateway layer
│   ├── client.ts          # Discord client initialization
│   ├── gateway.ts         # Gateway adapter for event normalization
│   └── intents.ts         # Discord intents configuration
├── bus/                   # Event distribution system
│   └── eventBus.ts       # Typed event bus implementation
├── events/                # Event normalization logic
│   ├── normalizeMessage.ts
│   ├── normalizeMember.ts
│   └── types.ts          # Event type definitions
├── plugins/               # Plugin implementations
│   ├── commands/         # Command handling plugin
│   ├── logging/          # Logging plugin
│   └── analytics/        # Analytics plugin
├── types/                # Core framework types and schemas
│   ├── index.ts          # Central type exports
│   ├── events.ts         # Event schemas (Zod) and types
│   └── plugin.ts         # Plugin interface definitions
├── utils/                # Utility functions
│   └── createLogger.ts   # Pino logger factory
└── index.ts              # Main entry point
```

## Development

### Code Style

This project uses [Biome](https://biomejs.dev/) for both linting and formatting:

- **Formatting**: 4 spaces, single quotes, semicolons, 120 character line width
- **Linting**: Recommended rules with TypeScript support
- **Import sorting**: Automatic import organization

### Git Hooks

Pre-commit hooks automatically run:
- TypeScript type checking
- Code linting
- Duplicate detection
- Commit message validation

### Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/) in past tense:

```
feat: added user authentication
fix: resolved memory leak in data processing
docs: updated installation instructions
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
bun run check-types
```

## Contributing

Please read our [Contributing Guide](CONTRIBUTING.md) for details on:
- Development setup
- Code style guidelines
- Pull request process
- Code of conduct

## Security

We take security seriously. If you discover a security vulnerability:

1. **Preferred**: Use GitHub's [private vulnerability reporting](https://github.com/AccordJS/accordjs/security) feature
2. **Alternative**: Email [angel@angelxmoreno.com](mailto:angel@angelxmoreno.com)

For more details, see our [Security Policy](SECURITY.md).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Core Concepts

### Event Flow
```
Discord Gateway → Gateway Adapter → Event Normalization (Zod) → Event Bus → Plugins
```

### Type Safety
AccordJS enforces strict type safety with:
- Zero `any` usage throughout the codebase
- Zod schemas for runtime validation and inferred types
- Discriminated union event types
- Typed plugin interfaces
- Compile-time event handler validation

### Plugin Development
Plugins subscribe to normalized events and operate independently:
```typescript
eventBus.subscribe('MESSAGE_CREATE', async (event) => {
    // Handle normalized message event
    console.log(`Message from ${event.userId}: ${event.content}`);
});
```

## Acknowledgments

- [Discord.js](https://discord.js.org/) - Discord API library
- [Bun](https://bun.sh/) - Fast all-in-one JavaScript runtime
- [Biome](https://biomejs.dev/) - One toolchain for your web project
- [Lefthook](https://github.com/evilmartians/lefthook) - Fast and powerful Git hooks manager

---

**Happy coding! 🚀**
