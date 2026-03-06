import { authHandlers } from './auth'
import { assetHandlers } from './assets'
import { employeeHandlers } from './employees'
import { assignmentHandlers } from './assignments'
import { referenceHandlers } from './reference'
import { attributesHandlers } from './attributes'
import { importsHandlers } from './imports'
import { exportsHandlers } from './exports'
import { filesHandlers } from './files'
import { auditHandlers } from './audit'
import { historyHandlers } from './history'
import { assetOpsHandlers } from './assetOps'
import { stocktakeHandlers } from './stocktake'

export const handlers = [
  ...authHandlers,
  ...assetHandlers,
  ...assetOpsHandlers,
  ...employeeHandlers,
  ...assignmentHandlers,
  ...stocktakeHandlers,
  ...referenceHandlers,
  ...attributesHandlers,
  ...importsHandlers,
  ...exportsHandlers,
  ...filesHandlers,
  ...auditHandlers,
  ...historyHandlers,
]
