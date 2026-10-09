import { describe, test, expect } from '@jest/globals'
import * as fs from 'fs'
import * as path from 'path'

import * as root from './index'

const moduleNames = fs
  .readdirSync(__dirname, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(__dirname, entry.name, 'index.ts')))
  .map((entry) => entry.name)

describe('root index', () => {
  test.each(moduleNames)('exports every runtime value exported by module %s', async (moduleName) => {
    const moduleExports = await import(`./${moduleName}`)
    const missingExports = Object.keys(moduleExports).filter((name) => !(name in root))
    expect(missingExports).toEqual([])
  })
})
