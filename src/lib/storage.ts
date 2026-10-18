import { supabase } from './supabase'

export async function uploadComprovante(file: File, paymentId: string): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg'
  const path = `${paymentId}-${Date.now()}.${ext}`

  const { error } = await supabase.storage.from('comprovantes').upload(path, file, { upsert: true })
  if (error) throw new Error(error.message)

  const { data } = supabase.storage.from('comprovantes').getPublicUrl(path)
  return data.publicUrl
}

async function resizeToJpeg(file: File, maxSize = 640): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Falha ao processar a imagem.'))), 'image/jpeg', 0.82),
  )
}

export async function uploadMenuFoto(file: File, menuItemId: string): Promise<string> {
  const blob = await resizeToJpeg(file)
  const path = `${menuItemId}-${Date.now()}.jpg`

  const { error } = await supabase.storage.from('cardapio').upload(path, blob, { contentType: 'image/jpeg' })
  if (error) throw new Error(error.message)

  const { data } = supabase.storage.from('cardapio').getPublicUrl(path)
  return data.publicUrl
}
