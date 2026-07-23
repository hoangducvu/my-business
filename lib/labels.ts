// ─── Shared activity + location display labels ──────────────────────────────

const ACTIVITY_LABELS: Record<string, string> = {
  phonecase:    'Phone Case',
  bracelet:     'Italian Charm Bracelet',
  pencilcase:   'Pencil Case',
  locket:       'Locket Heart',
  nightlamp:    'Night Lamp',
  passportcover:'Passport Cover',
  bagcharm:     'Bag Charm',
  beadbracelet: 'Bead Bracelet',
  phonechain:   'Phone Chain',
}

const LOCATION_LABELS: Record<string, string> = {
  plaza:   'The Plaza Sliema — Level 2',
  mercury: 'Mercury Tower — Level B1',
}

export function getActivityLabel(a: string) { return ACTIVITY_LABELS[a] ?? a }
export function getLocationLabel(l: string) { return LOCATION_LABELS[l] ?? l }
