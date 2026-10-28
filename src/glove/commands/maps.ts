import { fail, text, find, expectVersion, bump, event, business } from '../model'
import { mapsKey, placed, zonesFrom } from '../maps'
import type { Handler } from './types'

// DISP-002, DISP-010: the owner connects Google Maps with their own key (an installation
// secret); the desk places sites on the map; the owner draws each
// technician's service-area zones beside their ZIP codes (DISP-004).

export const maps: Handler = async (c, type, p, db) => {
  switch (type) {
    case 'maps.connect': {
      const b = business(c.s)
      c.sql.push(p.key === null ? { sql: "DELETE FROM glove_provider_keys WHERE provider='maps'", params: [] } : { sql: "INSERT INTO glove_provider_keys(provider,value,set_by,set_at) VALUES('maps',?,?,?) ON CONFLICT(provider) DO UPDATE SET value=excluded.value,set_by=excluded.set_by,set_at=excluded.set_at", params: [text(p.key, 'key', { max: 400 }), c.actor.id, c.now] })
      event(c, { jobId: null, subjectKind: 'business', subjectId: b.id, kind: p.key === null ? 'maps.disconnected' : 'maps.connected', summary: p.key === null ? 'Google Maps disconnected' : 'Google Maps key saved', data: null })
      return bump(c.s, 'business', b, { maps: p.key === null ? null : { connectedAt: c.now, by: c.actor.name } })
    }
    case 'site.locate': {
      const key = await mapsKey(db, c.s) ?? fail('MAPS', 'The owner connects Google Maps first.')
      const ids = Array.isArray(p.siteIds) && p.siteIds.length && p.siteIds.length <= 50 ? [...new Set(p.siteIds as unknown[])] : fail('INPUT', 'siteIds lists 1 to 50 sites.', { field: 'siteIds' }, 400)
      const sites = ids.map(id => find(c.s, 'sites', id, 'sites'))
      const results = []
      for (const site of sites) results.push({ siteId: site.id, location: await placed(c, key, { ...site, location: null }) })
      return { results }
    }
    case 'technician.zones': {
      const tech = find(c.s, 'technicians', p.technicianId, 'technicians')
      expectVersion(tech, p.version)
      const zones = zonesFrom(p.zones)
      const row = bump(c.s, 'technicians', tech, { zones })
      event(c, { jobId: null, subjectKind: 'technician', subjectId: tech.id, kind: 'technician.zones', summary: zones.length ? `${c.actor.name} saved ${tech.name}'s service-area zones: ${zones.map(z => `${z.name} (${z.points.length} corners)`).join(', ')}` : `${c.actor.name} removed ${tech.name}'s drawn zones`, data: { zones: zones.map(z => ({ id: z.id, name: z.name, corners: z.points.length })) } })
      return row
    }
  }
}
