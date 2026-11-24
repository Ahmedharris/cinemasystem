import { useMemo, useState } from 'react';
import { Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { EmptyState } from './Misc';
import { downloadCSV } from '../../lib/format';

/**
 * columns: [{ key, header, cell(row), sort(row)->value, csv(row)->value, className, align }]
 * filters: [{ key, label, options:[{value,label}], test(row, value) }]
 */
export default function DataTable({
  columns, rows, rowKey, searchText, searchPlaceholder = 'Search…', filters = [], pageSize = 10, toolbar,
  exportName, onRowClick, emptyTitle = 'Nothing here yet', emptyText, defaultSort, bare = false
}) {
  const [search, setSearch] = useState('');
  const [fv, setFv] = useState({});
  const [sort, setSort] = useState(defaultSort || null);
  const [page, setPage] = useState(1);

  const processed = useMemo(() => {
    let out = rows;
    const s = search.trim().toLowerCase();
    if (s && searchText) out = out.filter((r) => searchText(r).toLowerCase().includes(s));
    filters.forEach((f) => { const v = fv[f.key]; if (v) out = out.filter((r) => f.test(r, v)); });
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      if (col && col.sort) {
        out = [...out].sort((a, b) => {
          const x = col.sort(a), y = col.sort(b);
          const c = typeof x === 'number' && typeof y === 'number' ? x - y : String(x ?? '').localeCompare(String(y ?? ''));
          return sort.dir === 'asc' ? c : -c;
        });
      }
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, search, fv, sort]);

  const pages = Math.max(1, Math.ceil(processed.length / pageSize));
  const cur = Math.min(page, pages);
  const slice = processed.slice((cur - 1) * pageSize, cur * pageSize);

  const toggleSort = (c) => {
    if (!c.sort) return;
    setSort((s) => (s && s.key === c.key ? (s.dir === 'asc' ? { key: c.key, dir: 'desc' } : null) : { key: c.key, dir: 'asc' }));
  };
  const exportCsv = () => {
    const cols = columns.filter((c) => c.csv || c.sort);
    downloadCSV(exportName, [cols.map((c) => c.header), ...processed.map((r) => cols.map((c) => (c.csv ? c.csv(r) : c.sort(r))))]);
  };

  const hasBar = searchText || filters.length || toolbar || exportName;
  return (
    <div className={bare ? '' : 'card overflow-hidden'}>
      {hasBar && (
        <div className="flex flex-wrap items-center gap-3 p-4 border-b border-line">
          {searchText && (
            <div className="relative flex-1 min-w-[12rem] max-w-sm">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg3" />
              <input className="input input-sm pl-9" placeholder={searchPlaceholder} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
            </div>
          )}
          {filters.map((f) => (
            <select key={f.key} className="select input-sm w-auto min-w-[8rem]" value={fv[f.key] || ''} onChange={(e) => { setFv({ ...fv, [f.key]: e.target.value }); setPage(1); }} aria-label={f.label}>
              <option value="">{f.label}</option>
              {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          ))}
          <div className="flex items-center gap-2 ml-auto">
            {toolbar}
            {exportName && <button className="btn btn-outline btn-sm" onClick={exportCsv} title="Export the filtered rows"><Download size={14} /> CSV</button>}
          </div>
        </div>
      )}
      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key} className={`${c.sort ? 'sortable' : ''} ${c.className || ''}`} style={{ textAlign: c.align }} onClick={() => toggleSort(c)}>
                  <span className="inline-flex items-center gap-1">
                    {c.header}
                    {sort && sort.key === c.key && (sort.dir === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.map((r) => (
              <tr key={rowKey(r)} className={onRowClick ? 'clickable' : ''} onClick={onRowClick ? () => onRowClick(r) : undefined}>
                {columns.map((c) => <td key={c.key} className={c.className} style={{ textAlign: c.align }}>{c.cell ? c.cell(r) : c.sort(r)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!processed.length && <EmptyState title={rows.length ? 'No results match your filters' : emptyTitle} text={rows.length ? 'Try a different search or clear the filters.' : emptyText} />}
      {processed.length > pageSize && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-line text-xs text-fg2">
          <span>Showing {(cur - 1) * pageSize + 1}–{Math.min(cur * pageSize, processed.length)} of {processed.length}</span>
          <div className="flex items-center gap-1">
            <button className="btn btn-ghost btn-icon" disabled={cur <= 1} onClick={() => setPage(cur - 1)} aria-label="Previous page"><ChevronLeft size={16} /></button>
            <span className="px-2">Page {cur} / {pages}</span>
            <button className="btn btn-ghost btn-icon" disabled={cur >= pages} onClick={() => setPage(cur + 1)} aria-label="Next page"><ChevronRight size={16} /></button>
          </div>
        </div>
      )}
      {processed.length > 0 && processed.length <= pageSize && hasBar && (
        <div className="px-4 py-2.5 border-t border-line text-xs text-fg3">{processed.length} {processed.length === 1 ? 'record' : 'records'}</div>
      )}
    </div>
  );
}
