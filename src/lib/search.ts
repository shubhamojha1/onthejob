import MiniSearch from 'minisearch'
import type { Incident } from '../schema/incident'
import { SEARCH_FIELDS, SEARCH_STORE_FIELDS } from './search-config'

let instance: MiniSearch | null = null
let loading: Promise<MiniSearch> | null = null

export async function getSearchIndex(): Promise<MiniSearch> {
  if (instance) return instance
  if (loading) return loading

  loading = fetch('/data/search-index.json')
    .then(r => r.json())
    .then(data => {
      instance = MiniSearch.loadJSON<Incident>(JSON.stringify(data), {
        fields: [...SEARCH_FIELDS],
        storeFields: [...SEARCH_STORE_FIELDS],
      })
      return instance
    })

  return loading
}

export function searchIds(ms: MiniSearch, query: string): Set<string> {
  if (!query.trim()) return new Set()
  return new Set(ms.search(query, { prefix: true, fuzzy: 0.15 }).map(r => r.id as string))
}
