import { supabaseAdmin } from '@/lib/supabase'

/** Preserve IDs and unspecified language fields; archive removed words atomically. */
export async function saveVocabTerms(setId: string, terms: Record<string, unknown>[]) {
  const aliases: Record<string,string> = { definitionEs: 'definition_es', partOfSpeech: 'part_of_speech', imageUrl: 'image_url' }
  const rows = terms.map(term => Object.fromEntries(Object.entries(term).map(([k,v]) => [aliases[k] ?? k,v])))
  const { error } = await supabaseAdmin.rpc('save_vocab_terms', { p_set: setId, p_terms: rows })
  if (error) throw error
}
