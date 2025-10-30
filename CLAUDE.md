# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Arena Core is a TypeScript library that provides core type definitions and utilities for the Arena survey data collection platform. It's published as `@openforis/arena-core` to GitHub Packages and contains type definitions, validation logic, expression evaluation, and data manipulation utilities used across the Arena ecosystem.

## Development Commands

### Building

```bash
yarn build          # Compile TypeScript to dist/
yarn build:watch    # Compile with watch mode
```

### Testing

```bash
yarn test           # Run all Jest tests
jest path/to/test   # Run a single test file
```

### Linting & Formatting

```bash
yarn lint           # Run ESLint on all TypeScript files
yarn lint:fix       # Auto-fix ESLint issues
```

**Note:** Pre-commit hooks automatically run `lint-staged`, which runs ESLint with `--fix` and Prettier on staged files.

## Code Architecture

### Core Domain Model

The codebase follows a hierarchical domain model centered around surveys and data collection:

1. **Survey** (`src/survey/`) - Defines the survey structure, including:
   - Node definitions (form fields/entities)
   - Categories and taxonomies (reference data)
   - Dependency graphs (for expressions and validations)
   - Cycles (time periods for data collection)
   - Security settings

2. **NodeDef** (`src/nodeDef/`) - Survey field/entity definitions with types:
   - Entity (container), Boolean, Code (categorical), Coordinate, Date, Decimal, Integer, Text, Time, Taxon, File
   - Layout elements: FormHeader
   - Stores metadata: labels, descriptions, validations, expressions (applicable, defaultValues, validations)
   - Each NodeDef type has specific props defined in `src/nodeDef/types/`

3. **Record** (`src/record/`) - Survey data instances containing:
   - Nodes (actual data values)
   - Owner information
   - Step (entry/cleansing/analysis)
   - Cycle
   - Validation results

4. **Node** (`src/node/`) - Individual data values in a record:
   - References a NodeDef (nodeDefUuid)
   - Contains value and metadata
   - Maintains hierarchy (parentUuid)
   - Can reference CategoryItems or Taxon data

### Key Subsystems

**Expression System** (`src/expression/`, `src/nodeDefExpressionEvaluator/`)

- Parses and evaluates JavaScript expressions used in surveys
- Supports applicable conditions, default values, validations, formulas
- Uses JSEP (JavaScript Expression Parser) with custom evaluators
- `NodeDefExpressionEvaluator` - validates expressions against survey structure
- `RecordExpressionEvaluator` - evaluates expressions with record data

**Validation System** (`src/validation/`)

- Field-level validators in `src/validation/fieldValidators/`
- Record-level validation via `RecordValidator`
- Validation results track severity (error/warning/info), field-specific errors
- Validations defined on NodeDefs, executed on Nodes

**Record Update Pipeline** (`src/record/recordNodesUpdater/`)

- `RecordNodesUpdater` - orchestrates updates to record nodes
- `RecordUpdater` - high-level update operations
- Handles cascade effects: applicability changes, default values, dependent calculations
- Returns `RecordUpdateResult` with modified nodes

**Authorization** (`src/auth/`)

- `Authorizer` - permission checks for users
- Auth groups: systemAdmin, surveyAdmin, dataManager, dataEditor, dataCleanser, dataAnalyst, guest
- Permissions for survey operations (view/edit), record operations (CRUD), user management

**Reference Data** (`src/category/`, `src/taxonomy/`)

- Categories: hierarchical code lists (CategoryLevel → CategoryItem)
- Taxonomies: scientific classification (Taxonomy → Taxon → VernacularName)
- Used by Code and Taxon NodeDef types

**Service Registry** (`src/registry/`)

- Singleton pattern for registering domain services
- Allows dependency injection of custom implementations
- Services extend `ArenaService` interface

### Common Patterns

**Factory Pattern**

- Most domain objects have Factory classes (e.g., `SurveyFactory`, `RecordFactory`, `NodeDefFactory`)
- Factories create objects with proper defaults and structure
- Located alongside their domain objects

**Service Pattern**

- Services provide business logic for domain objects
- Exported as interfaces (e.g., `NodeDefService`, `RecordService`, `CategoryService`)
- Can be registered in `ServiceRegistry` for custom implementations

**ArenaObject**

- Common interface for domain objects: `{ uuid, props, validation }`
- Most domain types extend or follow this pattern
- Props contain the actual data, uuid is the identifier

**Utility Modules** (`src/utils/`)

- Arrays, Dates, Numbers, Objects, Strings, UUIDs, Promises, Queue
- FileNames, FileProcessor, RetryProcessor
- Prefer using these over re-implementing common operations

## TypeScript Configuration

- **Strict mode enabled** - all strict checks are on (noImplicitAny, strictNullChecks, etc.)
- **Target:** ES6, **Module:** CommonJS
- **Output:** `dist/` with declaration files (.d.ts)
- **Excludes:** test files (`*.test.ts`, `src/**/tests/**`) from build

## Testing

- Uses Jest with ts-jest
- Test files: `*.test.ts` or `*.spec.ts` in `src/`
- Test builders available: `SurveyBuilder`, `RecordBuilder` in `src/tests/builder/`
- Use builders to create test fixtures rather than manual object construction

## Linting Rules

- ESLint with TypeScript support
- Unused vars/args starting with `_` are allowed
- `@typescript-eslint/no-explicit-any` is OFF
- **Important:** `no-explicit-type-exports` plugin enforces using `export type { ... }` for type-only exports

## Package Publishing

- Published to GitHub Packages as `@openforis/arena-core`
- Requires GitHub authentication (see README.md)
- Version bumps are automated via CI (.github workflows)
- Only `dist/**/*` files are included in the published package
