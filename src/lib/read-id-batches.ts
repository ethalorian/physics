/** Keep PostgREST ID filters below the gateway's request-URL limit.
 * Use for unique-ID lookups; queries returning many rows per ID need pagination too.
 */
export async function readIdBatches<T>(
  ids: string[],
  read: (batch: string[]) => PromiseLike<{ data: T[] | null; error: unknown }>,
): Promise<T[]> {
  const uniqueIds = [...new Set(ids)]
  const rows: T[] = []
  for (let offset = 0; offset < uniqueIds.length; offset += 100) {
    const { data, error } = await read(uniqueIds.slice(offset, offset + 100))
    if (error) throw error
    rows.push(...(data ?? []))
  }
  return rows
}
