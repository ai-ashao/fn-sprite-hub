/** Export actions require a completed result from the current template and collection snapshot. */
export function canExportShare(input: {
  open: boolean
  busy: boolean
  expectedKey: string
  resultKey: string | undefined
  pageCount: number
}): boolean {
  return input.open && !input.busy && input.pageCount > 0 && input.resultKey === input.expectedKey
}
