/** Shrink a camera photo to at most 1600 px as JPEG so it fits the phone's outbox and the upload limit. */
export async function shrink(file: File): Promise<{ mediaType: string; base64: string }> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  return { mediaType: 'image/jpeg', base64: canvas.toDataURL('image/jpeg', 0.82).split(',')[1] }
}
