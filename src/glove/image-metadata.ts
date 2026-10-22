import { fail } from './model'

// Server-only: build a separate model copy; private originals stay untouched.
// These parsers validate container structure, not decoded pixels. Unknown image
// encodings fail closed; unknown ancillary metadata is discarded.
export function stripImageMetadata(bytes: Uint8Array, mediaType: string): Uint8Array {
  requireImage(bytes.length > 0 && bytes.length <= 1_500_000, 'Photo must be nonempty and at most 1.5 MB.')
  switch (mediaType) {
    case 'image/jpeg': return jpeg(bytes)
    case 'image/png': return png(bytes)
    case 'image/webp': return webp(bytes)
    default: return fail('PHOTO_METADATA', 'Unsupported photo media type.', null, 400)
  }
}

function requireImage(ok: unknown, message: string): asserts ok {
  if (!ok) fail('PHOTO_METADATA', message, null, 400)
}
const be16 = (b: Uint8Array, p: number) => b[p] * 256 + b[p + 1]
const le24 = (b: Uint8Array, p: number) => b[p] + b[p + 1] * 256 + b[p + 2] * 65536
const le32 = (b: Uint8Array, p: number) => (b[p] + b[p + 1] * 256 + b[p + 2] * 65536 + b[p + 3] * 16777216) >>> 0
const be32 = (b: Uint8Array, p: number) => (b[p] * 16777216 + b[p + 1] * 65536 + b[p + 2] * 256 + b[p + 3]) >>> 0
const ascii = (b: Uint8Array, p: number, n: number) => String.fromCharCode(...b.subarray(p, p + n))
function join(parts: Uint8Array[]) {
  const result = new Uint8Array(parts.reduce((n, p) => n + p.length, 0))
  let at = 0
  for (const part of parts) { result.set(part, at); at += part.length }
  return result
}

function jpeg(b: Uint8Array): Uint8Array {
  requireImage(b.length >= 4 && be16(b, 0) === 0xffd8, 'Invalid JPEG signature.')
  const parts: Uint8Array[] = [b.subarray(0, 2)], components = new Map<number, number>(), scanned = new Set<number>()
  const quantization = new Set<number>(), huffman = new Set<number>()
  let p = 2, frame = 0, scans = 0, restartInterval = 0
  while (p < b.length) {
    requireImage(b[p] === 0xff, 'JPEG marker expected.')
    while (p < b.length && b[p] === 0xff) p++
    requireImage(p < b.length, 'Truncated JPEG marker.')
    const marker = b[p++], start = p - 2
    if (marker === 0xd9) {
      requireImage(frame && scans && scanned.size === components.size && p === b.length, 'JPEG is incomplete or has trailing data.')
      parts.push(b.subarray(start, p))
      return join(parts)
    }
    requireImage(marker !== 0 && marker !== 0xd8 && !(marker >= 0xd0 && marker <= 0xd7), 'Unexpected JPEG standalone marker.')
    requireImage(p + 2 <= b.length, 'Truncated JPEG segment length.')
    const length = be16(b, p), data = p + 2, end = p + length
    requireImage(length >= 2 && end <= b.length, 'Truncated JPEG segment.')
    p = end
    // APP and COM may appear between progressive scans, too. Retain only the
    // fixed Adobe color-transform record, which contains no free-form metadata.
    if (marker >= 0xe0 && marker <= 0xef || marker === 0xfe) {
      if (marker === 0xee && length === 14 && ascii(b, data, 5) === 'Adobe' && b[end - 1] <= 2) {
        // Canonicalize the fixed fields too; retain only the rendering transform.
        parts.push(Uint8Array.of(0xff, 0xee, 0, 14, 65, 100, 111, 98, 101, 0, 100, 0, 0, 0, 0, b[end - 1]))
      }
      continue
    }
    if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
      requireImage(!frame && !scans && length >= 11, 'Invalid JPEG frame order or length.')
      const count = b[data + 5]
      requireImage(b[data] === 8 && be16(b, data + 1) > 0 && be16(b, data + 3) > 0 && count >= 1 && count <= 4 && length === 8 + 3 * count, 'Unsupported JPEG frame.')
      for (let i = data + 6; i < end; i += 3) {
        const sampling = b[i + 1]
        requireImage(!components.has(b[i]) && (sampling >> 4) >= 1 && (sampling >> 4) <= 4 && (sampling & 15) >= 1 && (sampling & 15) <= 4 && b[i + 2] <= 3, 'Invalid JPEG component.')
        components.set(b[i], b[i + 2])
      }
      frame = marker
    } else if (marker === 0xdb) {
      requireImage(length > 2, 'Empty JPEG quantization table.')
      for (let q = data; q < end;) {
        const spec = b[q++], precision = spec >> 4, size = precision === 0 ? 64 : 128
        requireImage(precision <= 1 && (spec & 15) <= 3 && q + size <= end, 'Invalid JPEG quantization table.')
        for (let i = q; i < q + size; i += precision + 1) requireImage(precision ? be16(b, i) !== 0 : b[i] !== 0, 'Zero JPEG quantization value.')
        quantization.add(spec & 15)
        q += size
      }
    } else if (marker === 0xc4) {
      requireImage(length > 2, 'Empty JPEG Huffman table.')
      for (let h = data; h < end;) {
        const spec = b[h++]
        requireImage((spec >> 4) <= 1 && (spec & 15) <= 3 && h + 16 <= end, 'Invalid JPEG Huffman table.')
        let symbols = 0, space = 1
        for (let i = 0; i < 16; i++) { space = space * 2 - b[h + i]; symbols += b[h + i]; requireImage(space >= 0, 'Oversubscribed JPEG Huffman table.') }
        requireImage(symbols > 0 && symbols <= 256 && h + 16 + symbols <= end, 'Truncated JPEG Huffman table.')
        huffman.add(spec)
        h += 16 + symbols
      }
    } else if (marker === 0xdd) {
      requireImage(length === 4, 'Invalid JPEG restart interval.')
      restartInterval = be16(b, data)
    } else if (marker === 0xda) {
      const count = b[data]
      requireImage(frame && count >= 1 && count <= components.size && length === 6 + count * 2, 'Invalid JPEG scan header.')
      const spectralStart = b[end - 3], spectralEnd = b[end - 2], approximation = b[end - 1]
      const selected = new Set<number>()
      for (let s = data + 1; s < data + 1 + count * 2; s += 2) {
        requireImage(components.has(b[s]) && !selected.has(b[s]) && (b[s + 1] >> 4) <= 3 && (b[s + 1] & 15) <= 3, 'Invalid JPEG scan component.')
        requireImage(quantization.has(components.get(b[s])!) && (frame === 0xc2
          ? spectralStart === 0 ? !!(approximation >> 4) || huffman.has(b[s + 1] >> 4) : huffman.has(16 + (b[s + 1] & 15))
          : huffman.has(b[s + 1] >> 4) && huffman.has(16 + (b[s + 1] & 15))), 'JPEG scan references a missing coding table.')
        selected.add(b[s])
        scanned.add(b[s])
      }
      requireImage(frame === 0xc2
        ? spectralStart <= spectralEnd && spectralEnd <= 63 && (spectralStart === 0 ? spectralEnd === 0 : count === 1) && (approximation >> 4) <= 13 && (approximation & 15) <= 13 && (!(approximation >> 4) || (approximation >> 4) === (approximation & 15) + 1)
        : spectralStart === 0 && spectralEnd === 63 && approximation === 0, 'Unsupported JPEG scan parameters.')
      parts.push(b.subarray(start, end))
      const entropyStart = p
      let entropyBytes = 0, restart = 0
      while (p < b.length) {
        if (b[p] !== 0xff) { p++; entropyBytes++; continue }
        const markerStart = p++
        while (p < b.length && b[p] === 0xff) p++
        requireImage(p < b.length, 'Truncated JPEG entropy marker.')
        const next = b[p]
        if (next === 0) {
          requireImage(p === markerStart + 1, 'Invalid JPEG byte stuffing.')
          p++; entropyBytes++; continue
        }
        if (next >= 0xd0 && next <= 0xd7) {
          requireImage(restartInterval > 0 && next === 0xd0 + restart, 'Invalid JPEG restart marker.')
          restart = (restart + 1) % 8; p++; continue
        }
        p = markerStart
        break
      }
      requireImage(entropyBytes > 0 && p < b.length, 'Empty or truncated JPEG scan.')
      parts.push(b.subarray(entropyStart, p)); scans++
      continue
    } else {
      return fail('PHOTO_METADATA', 'Unsupported JPEG coding marker.', null, 400)
    }
    parts.push(b.subarray(start, end))
  }
  return fail('PHOTO_METADATA', 'JPEG end marker is missing.', null, 400)
}

function crc32(b: Uint8Array, start: number, end: number) {
  let crc = 0xffffffff
  for (let p = start; p < end; p++) {
    crc ^= b[p]
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0)
  }
  return (crc ^ 0xffffffff) >>> 0
}

function png(b: Uint8Array): Uint8Array {
  requireImage(b.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => b[i] === v), 'Invalid PNG signature.')
  const parts: Uint8Array[] = [b.subarray(0, 8)]
  let p = 8, color = -1, depth = 0, palette = 0, transparency = false, idat = 0, dataStarted = false, endedData = false
  const zlibHeader: number[] = []
  while (p < b.length) {
    requireImage(p + 12 <= b.length, 'Truncated PNG chunk header.')
    const size = be32(b, p), data = p + 8, end = data + size, type = ascii(b, p + 4, 4)
    requireImage(size <= 0x7fffffff && end + 4 <= b.length && /^[A-Za-z]{2}[A-Z][A-Za-z]$/.test(type), 'Invalid PNG chunk length or type.')
    requireImage(crc32(b, p + 4, end) === be32(b, end), 'PNG chunk checksum failed.')
    requireImage(color !== -1 || type === 'IHDR', 'PNG must start with its image header.')
    requireImage(!['acTL', 'fcTL', 'fdAT'].includes(type), 'Animated PNG photos are unsupported for model copies.')
    if (type !== 'IDAT' && dataStarted) endedData = true
    if (type === 'IHDR') {
      requireImage(p === 8 && size === 13, 'Invalid or repeated PNG image header.')
      const width = be32(b, data), height = be32(b, data + 4)
      depth = b[data + 8]; color = b[data + 9]
      const depths: Record<number, number[]> = { 0: [1, 2, 4, 8, 16], 2: [8, 16], 3: [1, 2, 4, 8], 4: [8, 16], 6: [8, 16] }
      requireImage(width > 0 && width <= 0x7fffffff && height > 0 && height <= 0x7fffffff && depths[color]?.includes(depth) && b[data + 10] === 0 && b[data + 11] === 0 && b[data + 12] <= 1, 'Unsupported PNG image header.')
    } else if (type === 'PLTE') {
      requireImage(!palette && !transparency && !dataStarted && color !== 0 && color !== 4 && size > 0 && size % 3 === 0 && size <= 768 && (color !== 3 || size / 3 <= 2 ** depth), 'Invalid PNG palette or palette order.')
      palette = size / 3
      // Truecolor palettes are optional display suggestions, not image pixels.
      if (color !== 3) { p = end + 4; continue }
    } else if (type === 'tRNS') {
      requireImage(!transparency && !dataStarted && (color === 0 && size === 2 || color === 2 && size === 6 || color === 3 && palette > 0 && size > 0 && size <= palette), 'Invalid PNG transparency.')
      if (color === 0 || color === 2) for (let i = data; i < end; i += 2) requireImage(be16(b, i) < 2 ** depth, 'Invalid PNG transparent sample.')
      transparency = true
    } else if (type === 'IDAT') {
      requireImage(!endedData && (color !== 3 || palette > 0), 'Invalid PNG image-data order or missing palette.')
      for (let i = data; i < end && zlibHeader.length < 2; i++) zlibHeader.push(b[i])
      dataStarted = true
      idat += size
    } else if (type === 'IEND') {
      requireImage(size === 0 && idat >= 6 && end + 4 === b.length, 'PNG is incomplete or has trailing data.')
      requireImage((zlibHeader[0] & 15) === 8 && (zlibHeader[0] >> 4) <= 7 && !(zlibHeader[1] & 32) && (zlibHeader[0] * 256 + zlibHeader[1]) % 31 === 0, 'Invalid PNG compression header.')
      parts.push(b.subarray(p, end + 4))
      return join(parts)
    } else {
      requireImage(type[0] === type[0].toLowerCase(), 'Unsupported PNG critical chunk.')
      // Whitelist image data only: removes eXIf, text, XMP, profiles, timestamps,
      // physical coordinates and unknown/private ancillary chunks alike.
      p = end + 4
      continue
    }
    parts.push(b.subarray(p, end + 4)); p = end + 4
  }
  return fail('PHOTO_METADATA', 'PNG end chunk is missing.', null, 400)
}

function webp(b: Uint8Array): Uint8Array {
  requireImage(b.length >= 20 && ascii(b, 0, 4) === 'RIFF' && ascii(b, 8, 4) === 'WEBP' && le32(b, 4) === b.length - 8, 'Invalid WebP RIFF header or length.')
  const parts: Uint8Array[] = [b.slice(0, 12)]
  let p = 12, extended = false, flags = 0, canvasWidth = 0, canvasHeight = 0, width = 0, height = 0, image = '', alpha = false, alphaSize = 0, alphaRaw = false
  const metadata = new Set<string>()
  while (p < b.length) {
    requireImage(p + 8 <= b.length, 'Truncated WebP chunk header.')
    const type = ascii(b, p, 4), size = le32(b, p + 4), data = p + 8, end = data + size, padded = end + (size & 1)
    requireImage(padded <= b.length && (!(size & 1) || b[end] === 0), 'Truncated WebP chunk or invalid padding.')
    requireImage(type !== 'ANIM' && type !== 'ANMF', 'Animated WebP photos are unsupported for model copies.')
    if (type === 'VP8X') {
      requireImage(p === 12 && size === 10 && !(b[data] & 0xc1) && b[data + 1] === 0 && b[data + 2] === 0 && b[data + 3] === 0, 'Invalid WebP extended header.')
      flags = b[data]
      requireImage(!(flags & 2), 'Animated WebP photos are unsupported for model copies.')
      extended = true; canvasWidth = le24(b, data + 4) + 1; canvasHeight = le24(b, data + 7) + 1
      const clean = b.slice(p, padded)
      clean[8] &= ~0x2c // ICCP, EXIF and XMP feature flags.
      parts.push(clean)
    } else if (type === 'VP8 ' || type === 'VP8L') {
      requireImage(!image && size >= (type === 'VP8 ' ? 11 : 6), 'Missing or repeated WebP image payload.')
      image = type
      if (type === 'VP8 ') {
        const tag = le24(b, data), partition = tag >>> 5
        requireImage(!(tag & 1) && ((tag >> 1) & 7) <= 3 && (tag & 16) && partition > 0 && partition <= size - 10 && ascii(b, data + 3, 3) === '\x9d\x01\x2a', 'Invalid WebP VP8 keyframe.')
        width = b[data + 6] + b[data + 7] * 256; height = b[data + 8] + b[data + 9] * 256
        requireImage(width > 0 && width <= 16383 && height > 0 && height <= 16383, 'Unsupported WebP VP8 dimensions.')
      } else {
        requireImage(!alpha && b[data] === 0x2f, 'Invalid WebP lossless image or separate alpha chunk.')
        const bits = le32(b, data + 1)
        requireImage(!(bits >>> 29), 'Unsupported WebP lossless version.')
        width = (bits & 0x3fff) + 1; height = ((bits >>> 14) & 0x3fff) + 1; alpha = !!(bits & 0x10000000)
      }
      parts.push(b.subarray(p, padded))
    } else if (type === 'ALPH') {
      requireImage(extended && !image && !alpha && size >= 2 && !(b[data] & 0xc0) && (b[data] & 3) <= 1 && ((b[data] >> 4) & 3) <= 1, 'Invalid WebP alpha chunk or order.')
      alpha = true; alphaRaw = !(b[data] & 3); alphaSize = size
      parts.push(b.subarray(p, padded))
    } else {
      if (type === 'ICCP' || type === 'EXIF' || type === 'XMP ') {
        requireImage(extended && !metadata.has(type) && size > 0, 'Invalid or repeated WebP metadata chunk.')
        requireImage(type === 'ICCP' ? !image && !alpha : !!image, 'Invalid WebP metadata order.')
        metadata.add(type)
      }
      // Discard all other chunks, including unrecognized private metadata.
    }
    p = padded
  }
  requireImage(image && (!extended || width === canvasWidth && height === canvasHeight && !!(flags & 16) === alpha), 'WebP image is missing or does not match its extended header.')
  requireImage(!alphaRaw || alphaSize === 1 + width * height, 'Truncated WebP raw alpha plane.')
  if (extended) requireImage(!!(flags & 32) === metadata.has('ICCP') && !!(flags & 8) === metadata.has('EXIF') && !!(flags & 4) === metadata.has('XMP '), 'WebP metadata feature flags do not match its chunks.')
  const result = join(parts), riffSize = result.length - 8
  for (let i = 0; i < 4; i++) result[4 + i] = (riffSize >>> (8 * i)) & 255
  return result
}
