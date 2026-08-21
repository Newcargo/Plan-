// Wiederverwendbare Sortierlogik fuer Tabellen-Spaltenkoepfe.
// Nutzung:
//   1. Kopf rendern:   sortableHeader('Name', 'name', state)
//   2. Nach dem Rendern der Tabelle: wireSortHeaders(container, state, () => renderRows())
//   3. Vor dem Rendern der Zeilen:   sortArray(data, state)

export function createSortState(defaultKey = null, defaultAsc = true) {
  return { key: defaultKey, asc: defaultAsc };
}

export function sortableHeader(label, key, state, tag = 'th') {
  const active = state.key === key;
  const arrow = active ? (state.asc ? '▲' : '▼') : '▲▼';
  return `<${tag} class="sortable${active ? ' sort-active' : ''}" data-sort-key="${key}">${label}<span class="sort-arrow">${arrow}</span></${tag}>`;
}

export function wireSortHeaders(container, state, onChange) {
  container.querySelectorAll('.sortable').forEach(el => {
    el.addEventListener('click', () => {
      const key = el.dataset.sortKey;
      if (state.key === key) {
        state.asc = !state.asc;
      } else {
        state.key = key;
        state.asc = true;
      }
      onChange();
    });
  });
}

// Sortiert ein Array in-place nach state.key. Erkennt Text (localeCompare, de) vs. Zahlen automatisch.
export function sortArray(data, state) {
  if (!state.key) return data;
  const dir = state.asc ? 1 : -1;
  data.sort((a, b) => {
    const va = a[state.key];
    const vb = b[state.key];
    if (va == null && vb == null) return 0;
    if (va == null) return 1;
    if (vb == null) return -1;
    if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
    return String(va).localeCompare(String(vb), 'de', { sensitivity: 'base' }) * dir;
  });
  return data;
}
