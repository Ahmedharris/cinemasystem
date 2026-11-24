import { useState } from 'react';
import { Wallet, Undo2, Ticket, Popcorn, Printer, Download } from 'lucide-react';
import { useDb, useDocumentTitle } from '../../hooks/useDb';
import { useAuth } from '../../context/AuthContext';
import { q, table, availability, parseDT, now } from '../../lib/db';
import * as A from '../../lib/analytics';
import { PageHeader, StatCard, Tabs } from '../../components/ui/Misc';
import { BarChart, HBars, Donut } from '../../components/ui/Charts';
import { money, downloadCSV, titleCase } from '../../lib/format';

export default function AdminReports() {
  useDb();
  useDocumentTitle('Reports · Admin');
  const { cinemaScope: scope, isAdmin } = useAuth();
  const [days, setDays] = useState(30);
  const range = A.lastDays(days);
  const pay = A.netPayments({ cinemaId: scope, range });
  const tickets = A.ticketsSold({ cinemaId: scope, range });
  const food = A.foodSales({ cinemaId: scope, range });
  const foodRevenue = food.reduce((a, f) => a + f.revenue, 0);
  const byMovie = A.ticketsByMovie({ cinemaId: scope, range });
  const split = A.paymentSplit({ cinemaId: scope, range });
  const cust = A.topCustomers({ cinemaId: scope, range });
  const promos = A.promoReport();
  const chartDays = A.revenueByDay(Math.min(days || 30, 30), scope);

  // average occupancy by start time (finished or on-sale shows in range)
  const slots = {};
  table('showtime').forEach((s) => {
    if (s.show_status === 'CANCELLED' || s.show_status === 'DRAFT' || (scope && q.screen(s.screen_id).cinema_id !== scope)) return;
    const st = parseDT(s.start_time);
    if (range && range.from && st < range.from) return;
    if (st > new Date(now().getTime() + 2 * 86400000)) return;
    const key = s.start_time.slice(11, 16);
    slots[key] = slots[key] || { sum: 0, n: 0 };
    slots[key].sum += availability(s).pct; slots[key].n += 1;
  });
  const slotData = Object.entries(slots).sort().map(([label, v]) => ({ label, value: Math.round(v.sum / v.n) }));

  const exportAll = () => downloadCSV(`cinemax-report-${days || 'all'}d`, [
    ['Metric', 'Value'], ['Gross collected', pay.gross], ['Refunds', pay.refunds], ['Net revenue', pay.net], ['Tickets sold', tickets], ['Food revenue', foodRevenue], [],
    ['Movie', 'Tickets'], ...byMovie.map((m) => [m.label, m.value]), [],
    ['Customer', 'Bookings', 'Spent'], ...cust.list.map((c) => [c.label, c.bookings, c.value])
  ]);

  return (
    <div>
      <PageHeader title="Reports" subtitle={`Sales and operations summary ${scope ? `for ${q.cinema(scope).cinema_name}` : 'for all cinemas'}.`}
        actions={<><button className="btn btn-secondary" onClick={exportAll}><Download size={16} /> Export CSV</button><button className="btn btn-outline" onClick={() => window.print()}><Printer size={16} /> Print</button></>} />
      <Tabs className="mb-6 no-print" value={days} onChange={setDays} tabs={[{ value: 7, label: 'Last 7 days' }, { value: 30, label: 'Last 30 days' }, { value: 90, label: 'Last 90 days' }, { value: 0, label: 'All time' }]} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        <StatCard icon={Wallet} label="Net revenue" value={money(pay.net)} hint={`${money(pay.gross)} collected`} />
        <StatCard icon={Undo2} label="Refunds" value={money(pay.refunds)} tone="info" hint={`${pay.failed} failed attempts`} />
        <StatCard icon={Ticket} label="Tickets sold" value={tickets} tone="ok" hint={tickets ? `${money(pay.gross / Math.max(1, tickets))} per ticket` : ''} />
        <StatCard icon={Popcorn} label="Food revenue" value={money(foodRevenue)} tone="warn" hint={`${food.reduce((a, f) => a + f.value, 0)} items sold`} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3 mb-6">
        <div className="card card-pad xl:col-span-2"><h3 className="font-semibold mb-5">Net revenue by day <span className="text-fg3 font-normal text-xs">· last {chartDays.length} days</span></h3><BarChart data={chartDays} format={(v) => (v >= 1000 ? `${Math.round(v / 100) / 10}k` : v)} height={230} /></div>
        <div className="card card-pad"><h3 className="font-semibold mb-5">Payment methods</h3>{split.length ? <Donut data={split} size={150} thickness={20} centerLabel="Methods" centerValue={split.length} /> : <p className="text-sm text-fg3 py-8 text-center">No payments in this period.</p>}</div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3 mb-6">
        <div className="card card-pad"><h3 className="font-semibold mb-5">Tickets by movie</h3><HBars data={byMovie.slice(0, 8)} format={(v) => `${v}`} /></div>
        <div className="card card-pad"><h3 className="font-semibold mb-5">Occupancy by start time</h3><HBars data={slotData} max={100} format={(v) => `${v}%`} color="var(--color-info)" empty="No shows in this period." /></div>
        {isAdmin ? <div className="card card-pad"><h3 className="font-semibold mb-5">Revenue by cinema</h3><HBars data={A.revenueByCinema(range)} format={money} color="var(--color-ok)" /></div>
          : <div className="card card-pad"><h3 className="font-semibold mb-5">Best-selling food</h3><HBars data={food.slice(0, 6)} format={(v) => `${v} sold`} color="var(--color-ok)" /></div>}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="card overflow-hidden">
          <div className="p-5 border-b border-line"><h3 className="font-semibold">Top customers</h3><p className="text-xs text-fg3 mt-0.5">Customers spending above the average of {money(cust.avg)}</p></div>
          <table className="tbl"><thead><tr><th>Customer</th><th>Bookings</th><th>Spent</th></tr></thead><tbody>
            {cust.aboveAverage.slice(0, 8).map((c) => <tr key={c.user_id}><td className="font-medium">{c.label}</td><td>{c.bookings}</td><td className="font-semibold">{money(c.value)}</td></tr>)}
            {!cust.aboveAverage.length && <tr><td colSpan={3} className="text-center text-fg3 py-6">No data.</td></tr>}
          </tbody></table>
        </div>
        <div className="card overflow-hidden">
          <div className="p-5 border-b border-line"><h3 className="font-semibold">Promotion performance</h3><p className="text-xs text-fg3 mt-0.5">All time, confirmed bookings only</p></div>
          <table className="tbl"><thead><tr><th>Code</th><th>Redemptions</th><th>Discount given</th></tr></thead><tbody>
            {promos.map((r) => <tr key={r.promo.promotion_id}><td className="font-mono font-bold tracking-wider text-gold">{r.promo.promo_code}</td><td>{r.uses}</td><td>{money(r.discount)}</td></tr>)}
          </tbody></table>
        </div>
        <div className="card overflow-hidden xl:col-span-2">
          <div className="p-5 border-b border-line"><h3 className="font-semibold">Food sales</h3></div>
          <table className="tbl"><thead><tr><th>Item</th><th>Units</th><th>Revenue</th></tr></thead><tbody>
            {food.map((f) => <tr key={f.label}><td className="font-medium">{f.label}</td><td>{f.value}</td><td>{money(f.revenue)}</td></tr>)}
            {!food.length && <tr><td colSpan={3} className="text-center text-fg3 py-6">No food sold in this period.</td></tr>}
          </tbody></table>
        </div>
      </div>
    </div>
  );
}
