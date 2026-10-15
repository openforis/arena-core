import { describe, expect, test } from '@jest/globals'
import * as path from 'path'
import * as ts from 'typescript'

// The deprecated API forms must be flagged also for the consumers of the package, i.e. in the emitted .d.ts files:
// a type used in an exported value but not exported itself is inlined in the declarations, losing its JSDoc (@deprecated).

const rootDir = path.resolve(__dirname, '..')
const emittedDir = path.join(rootDir, 'declarations-test-dist')

const consumerFileName = path.join(rootDir, 'declarations-test-consumer.ts')
const consumerSource = `
import { ArenaRecord, ArenaRecordNode, Nodes, Records, Validations } from './declarations-test-dist'

declare const record: ArenaRecord
declare const node: ArenaRecordNode

export const deprecated_assocValue = Nodes.assocValue(node, 1, true)
export const deprecated_dissocFieldValidation = Validations.dissocFieldValidation('field', true)

export const current_getChildren = Records.getChildren(node, 'def')(record)
export const current_getParent = Records.getParent(node)(record)
export const current_getAncestor = Records.getAncestor(node, 'def')(record)
export const current_getNodeIndex = Records.getNodeIndex(node)(record)
export const current_assocValue = Nodes.assocValue(node, 1, { sideEffect: true })
export const current_dissocFieldValidation = Validations.dissocFieldValidation('field', { sideEffect: true })
`

const emitDeclarations = (): Map<string, string> => {
  const configPath = path.join(rootDir, 'tsconfig.json')
  const config = ts.getParsedCommandLineOfConfigFile(
    configPath,
    {},
    {
      ...ts.sys,
      onUnRecoverableConfigFileDiagnostic: (diagnostic) => {
        throw new Error(ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'))
      },
    }
  )!
  const options: ts.CompilerOptions = {
    ...config.options,
    declaration: true,
    emitDeclarationOnly: true,
    outDir: emittedDir,
    noEmit: false,
    sourceMap: false,
  }
  const files = new Map<string, string>()
  const program = ts.createProgram(config.fileNames, options)
  program.emit(undefined, (fileName, text) => files.set(path.resolve(fileName), text))
  return files
}

const getDeprecatedFlagsByConsumerExport = (emittedFiles: Map<string, string>): Record<string, boolean> => {
  const options: ts.CompilerOptions = {
    strict: true,
    skipLibCheck: true,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    types: [],
  }
  const host = ts.createCompilerHost(options)
  const readFile = (fileName: string) =>
    path.resolve(fileName) === consumerFileName
      ? consumerSource
      : (emittedFiles.get(path.resolve(fileName)) ?? host.readFile(fileName))
  const program = ts.createProgram([consumerFileName], options, {
    ...host,
    fileExists: (fileName) => readFile(fileName) !== undefined,
    directoryExists: (dirName) => {
      const dirPath = path.resolve(dirName) + path.sep
      return (
        [...emittedFiles.keys()].some((fileName) => fileName.startsWith(dirPath)) || ts.sys.directoryExists(dirName)
      )
    },
    readFile,
    getSourceFile: (fileName, languageVersion) => {
      const text = readFile(fileName)
      return text === undefined ? undefined : ts.createSourceFile(fileName, text, languageVersion, true)
    },
  })
  const diagnostics = ts.getPreEmitDiagnostics(program).map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n'))
  expect(diagnostics).toEqual([])
  const checker = program.getTypeChecker()
  const sourceFile = program.getSourceFile(consumerFileName)!
  const result: Record<string, boolean> = {}
  const visit = (node: ts.Node) => {
    if (ts.isVariableDeclaration(node) && node.initializer) {
      // the getter call is the innermost call: getter(params)(record)
      let call = node.initializer as ts.CallExpression
      while (ts.isCallExpression(call.expression)) call = call.expression
      const declaration = checker.getResolvedSignature(call)?.declaration
      result[node.name.getText(sourceFile)] = !!declaration && !!ts.getJSDocDeprecatedTag(declaration)
    }
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)
  return result
}

describe('Emitted declarations', () => {
  test('deprecated API forms are flagged as deprecated for the consumers', () => {
    const deprecatedFlags = getDeprecatedFlagsByConsumerExport(emitDeclarations())

    const names = Object.keys(deprecatedFlags)
    expect(names.length).toBeGreaterThan(0)
    for (const name of names) {
      expect({ name, deprecated: deprecatedFlags[name] }).toEqual({ name, deprecated: name.startsWith('deprecated_') })
    }
  }, 120000)
})
