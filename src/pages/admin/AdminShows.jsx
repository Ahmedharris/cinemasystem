import React, { useState } from 'react';
import { CalendarDays, Plus, Search, Ban, CheckCircle2, Clock, X, AlertTriangle } from 'lucide-react';
import { useCinema } from '../../context/CinemaContext';
import { CURRENCY, SCREEN_BASE_PRICE, pad2 } from '../../data/initialData';
import AdminLayout from '../../components/AdminLayout';

export default function AdminShows() {
  const { shows, movies, screens, cinemas, addShow, cancelShow } = useCinema();

  const [filterCinema, setFilterCinema] = useState('');
  const [filterMovie, setFilterMovie] = useState('');

  // Distinct dates
  const dates = [...new Set(shows.map(s => s.date))].sort();
  const [filterDate, setFilterDate] = useState(() => dates[0] || '');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMovieId, setSelectedMovieId] = useState(() => movies[0]?.id || 1);
  const [selectedScreenId, setSelectedScreenId] = useState(() => screens[0]?.id || 1);
  const [showDate, setShowDate] = useState(() => dates[0] || new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('18:00');
  const [basePrice, setBasePrice] = useState(800);

  const selectedMovie = movies.find(m => m.id === Number(selectedMovieId));
  const selectedScreen = screens.find(sc => sc.id === Number(selectedScreenId));

  // Compute calculated end time
  const calculateEndTime = (start, duration) => {
    if (!start) return '';
    const [h, m] = start.split(':').map(Number);
    const totalMin = h * 60 + m + (duration || 120) + 15;
    const endH = Math.floor(totalMin / 60) % 24;
    const endM = totalMin % 60;
    return `${pad2(endH)}:${pad2(endM)}`;
  };

  const calculatedEnd = calculateEndTime(startTime, selectedMovie?.duration);

  const openScheduleModal = () => {
    const defaultScreen = screens[0];
    setSelectedScreenId(defaultScreen.id);
    setBasePrice(SCREEN_BASE_PRICE[defaultScreen.type] || 800);
    setModalOpen(true);
  };

  const handleScreenChange = (screenId) => {
    setSelectedScreenId(screenId);
    const scr = screens.find(s => s.id === Number(screenId));
    if (scr) {
      setBasePrice(SCREEN_BASE_PRICE[scr.type] || 800);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const result = addShow({
      movieId: selectedMovieId,
      screenId: selectedScreenId,
      date: showDate,
      start: startTime,
      basePrice: Number(basePrice)
    });

    if (!result.success) {
      alert(`⚠️ ${result.message}`);
    } else {
      setModalOpen(false);
      alert('Show scheduled successfully!');
    }
  };

  const handleCancel = (showId) => {
    if (window.confirm('Cancel this show? Tickets already booked will need refunding.')) {
      cancelShow(showId);
    }
  };

  const filteredShows = shows.filter(s => {
    if (filterDate && s.date !== filterDate) return false;
    if (filterMovie && String(s.movieId) !== String(filterMovie)) return false;
    if (filterCinema) {
      const sc = screens.find(scr => scr.id === s.screenId);
      if (String(sc?.cinemaId) !== String(filterCinema)) return false;
    }
    return true;
  }).sort((a, b) => a.screenId - b.screenId || a.start.localeCompare(b.start));

  return (
    <AdminLayout
      title="Showtimes &amp; Screen Scheduling"
      subtitle="Schedule movie showtimes across branches with automated conflict detection."
      actions={
        <button
          onClick={openScheduleModal}
          className="bg-amber-500 hover:bg-amber-400 text-black font-extrabold px-3.5 py-2 rounded-xl text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Schedule New Show
        </button>
      }
    >
      <div className="space-y-6">
        {/* Filters Toolbar */}
        <div className="bg-[#111726] border border-[#1f2b42] p-4 rounded-2xl flex flex-wrap items-center gap-3">
          <select
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="bg-[#182238] border border-[#23304a] rounded-xl px-3 py-2 text-xs text-amber-400 font-bold focus:outline-none focus:border-amber-400"
          >
            {dates.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <select
            value={filterCinema}
            onChange={(e) => setFilterCinema(e.target.value)}
            className="bg-[#182238] border border-[#23304a] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
          >
            <option value="">All Cinema Branches</option>
            {cinemas.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.city})</option>
            ))}
          </select>

          <select
            value={filterMovie}
            onChange={(e) => setFilterMovie(e.target.value)}
            className="bg-[#182238] border border-[#23304a] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
          >
            <option value="">All Movies</option>
            {movies.map(m => (
              <option key={m.id} value={m.id}>{m.title}</option>
            ))}
          </select>
        </div>

        {/* Shows Table */}
        <div className="bg-[#111726] border border-[#1f2b42] rounded-3xl p-6 shadow-xl space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-500 border-b border-[#1f2b42]">
                  <th className="pb-3 font-semibold">ID</th>
                  <th className="pb-3 font-semibold">Time Window</th>
                  <th className="pb-3 font-semibold">Movie</th>
                  <th className="pb-3 font-semibold">Branch &amp; Screen</th>
                  <th className="pb-3 font-semibold">Screen Type</th>
                  <th className="pb-3 font-semibold">Base Price</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f2b42]">
                {filteredShows.map(show => {
                  const m = movies.find(mv => mv.id === show.movieId);
                  const sc = screens.find(scr => scr.id === show.screenId);
                  const c = cinemas.find(cin => cin.id === sc?.cinemaId);
                  const isCancelled = show.status === 'CANCELLED';

                  return (
                    <tr key={show.id} className="hover:bg-[#182238]/40">
                      <td className="py-3 font-mono text-slate-500">#{show.id}</td>
                      <td className="py-3 font-mono font-bold text-white">
                        {show.start} – {show.end}
                      </td>
                      <td className="py-3 font-semibold text-slate-200">
                        {m?.title || 'Movie'}
                      </td>
                      <td className="py-3 text-slate-300">
                        <div>{c?.name}</div>
                        <div className="text-[10px] text-slate-500">{sc?.name}</div>
                      </td>
                      <td className="py-3">
                        <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded text-[10px] font-semibold">
                          {sc?.type}
                        </span>
                      </td>
                      <td className="py-3 font-bold text-amber-400">
                        {CURRENCY} {show.basePrice}
                      </td>
                      <td className="py-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            isCancelled
                              ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {show.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        {!isCancelled && (
                          <button
                            onClick={() => handleCancel(show.id)}
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors inline-flex items-center gap-1"
                          >
                            <Ban className="w-3 h-3" /> Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Schedule Show Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111726] border border-[#23304a] rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-[#23304a] pb-3">
              <h3 className="font-bold text-white text-base">Schedule Movie Showtime</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-400 block mb-1">Select Movie</label>
                <select
                  value={selectedMovieId}
                  onChange={(e) => setSelectedMovieId(e.target.value)}
                  className="w-full bg-[#182238] border border-[#23304a] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                >
                  {movies.filter(m => m.status !== 'ARCHIVED').map(m => (
                    <option key={m.id} value={m.id}>{m.title} ({m.duration} mins)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-400 block mb-1">Cinema &amp; Screen</label>
                <select
                  value={selectedScreenId}
                  onChange={(e) => handleScreenChange(e.target.value)}
                  className="w-full bg-[#182238] border border-[#23304a] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                >
                  {screens.map(sc => {
                    const c = cinemas.find(cin => cin.id === sc.cinemaId);
                    return (
                      <option key={sc.id} value={sc.id}>
                        {c?.name} — {sc.name} ({sc.type})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-400 block mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={showDate}
                    onChange={(e) => setShowDate(e.target.value)}
                    className="w-full bg-[#182238] border border-[#23304a] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-400 block mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-[#182238] border border-[#23304a] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-400 block mb-1">Base Price (Rs.)</label>
                  <input
                    type="number"
                    required
                    min={100}
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    className="w-full bg-[#182238] border border-[#23304a] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-400 block mb-1">Calculated End Time</label>
                  <input
                    type="text"
                    disabled
                    value={calculatedEnd}
                    className="w-full bg-[#0d1322] border border-[#23304a] rounded-xl px-3 py-2 text-slate-400 font-mono"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Anti-collision rule: the system will automatically check if another show is active on this screen during this time window.
                </span>
              </div>

              <div className="pt-3 border-t border-[#23304a] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="bg-slate-800 text-slate-300 px-4 py-2 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 text-black px-5 py-2 rounded-xl font-extrabold"
                >
                  Schedule Show
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
