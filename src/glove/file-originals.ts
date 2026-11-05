// Keep camera originals below D1's per-row ceiling without changing their bytes.
export const inlineFileBytes = 1_500_000
export const documentPhotoBytes = 10_000_000

export async function originalBytes(db: D1Database, id: string, inline: ArrayBuffer): Promise<Uint8Array<ArrayBuffer>> {
  const chunks = (await db.prepare('SELECT bytes FROM glove_file_chunks WHERE file_id=? ORDER BY ordinal').bind(id).all<{ bytes: ArrayBuffer }>()).results
  const parts = [new Uint8Array(inline), ...chunks.map(chunk => new Uint8Array(chunk.bytes))]
  const bytes = new Uint8Array(parts.reduce((total, part) => total + part.length, 0))
  let offset = 0
  for (const part of parts) { bytes.set(part, offset); offset += part.length }
  return bytes
}
