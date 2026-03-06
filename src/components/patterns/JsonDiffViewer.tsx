interface JsonDiffViewerProps {
  oldJson: string | null
  newJson: string | null
}

function parseJson(value: string | null): unknown {
  if (!value) return null
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

function pretty(value: unknown) {
  if (value === null) return 'null'
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

function flattenObject(input: unknown, prefix = ''): Record<string, string> {
  if (input === null || input === undefined) {
    return prefix ? { [prefix]: 'null' } : {}
  }
  if (Array.isArray(input)) {
    return prefix ? { [prefix]: JSON.stringify(input) } : {}
  }
  if (typeof input !== 'object') {
    return prefix ? { [prefix]: String(input) } : {}
  }

  const entries: Record<string, string> = {}
  Object.entries(input as Record<string, unknown>).forEach(([key, value]) => {
    const next = prefix ? `${prefix}.${key}` : key
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(entries, flattenObject(value, next))
    } else {
      entries[next] = value === null ? 'null' : Array.isArray(value) ? JSON.stringify(value) : String(value)
    }
  })
  return entries
}

export function JsonDiffViewer({ oldJson, newJson }: JsonDiffViewerProps) {
  const parsedOld = parseJson(oldJson)
  const parsedNew = parseJson(newJson)

  const oldFlat = flattenObject(parsedOld)
  const newFlat = flattenObject(parsedNew)
  const diffKeys = Array.from(new Set([...Object.keys(oldFlat), ...Object.keys(newFlat)])).filter(
    (key) => oldFlat[key] !== newFlat[key],
  )

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border bg-slate-900/60 p-3">
        <h4 className="mb-2 text-sm font-semibold text-slate-200">Changed Fields</h4>
        {diffKeys.length === 0 ? (
          <p className="text-xs text-slate-400">No field-level changes detected.</p>
        ) : (
          <div className="max-h-56 overflow-auto">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-950 text-left text-slate-300">
                <tr>
                  <th className="px-2 py-1 font-semibold">Field</th>
                  <th className="px-2 py-1 font-semibold">Old</th>
                  <th className="px-2 py-1 font-semibold">New</th>
                </tr>
              </thead>
              <tbody>
                {diffKeys.map((key) => (
                  <tr key={key} className="border-t border-border/70 align-top">
                    <td className="px-2 py-1 font-medium text-slate-200">{key}</td>
                    <td className="px-2 py-1 text-rose-300">{oldFlat[key] ?? '-'}</td>
                    <td className="px-2 py-1 text-emerald-300">{newFlat[key] ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-lg border border-rose-500/35 bg-rose-950/30 p-3">
          <h4 className="mb-2 text-sm font-semibold text-rose-300">Old JSON</h4>
          <pre className="max-h-72 overflow-auto text-xs text-rose-100">{pretty(parsedOld)}</pre>
        </div>
        <div className="rounded-lg border border-emerald-500/35 bg-emerald-950/30 p-3">
          <h4 className="mb-2 text-sm font-semibold text-emerald-300">New JSON</h4>
          <pre className="max-h-72 overflow-auto text-xs text-emerald-100">{pretty(parsedNew)}</pre>
        </div>
      </div>
    </div>
  )
}
