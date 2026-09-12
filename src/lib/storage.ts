import { supabase } from './supabase'

export async function uploadComprovante(file: File, paymentId: string): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg'
  const path = `${paymentId}-${Date.now()}.${ext}`

  const { error } = await supabase.storage.from('comprovantes').upload(path, file, { upsert: true })
  if (error) throw new Error(error.message)

  const { data } = supabase.storage.from('comprovantes').getPublicUrl(path)
  return data.publicUrl
}
