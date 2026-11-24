import React, { useState } from 'react';
import { Building2, Plus, Eye, Armchair, X, Check } from 'lucide-react';
import { useCinema } from '../../context/CinemaContext';
import { getScreenSeats } from '../../data/initialData';
import AdminLayout from '../../components/AdminLayout';

export default function AdminCinemas() {
  const { cinemas, screens, addCinema, addScreen } = useCinema();

  const [activeScreenId, setActiveScreenId] = useState(() => screens[0]?.id || 1);

  // Cinema Modal
  const [cinemaModalOpen, setCinemaModalOpen] = useState(false);
  const [cinemaName, setCinemaName] = useState('');
  const [city, setCity] = useState('Lahore');
  const [address, setAddress] = useState('');
  const [contact, setContact] = useState('042-111-222-333');

  // Screen Modal
  const [screenModalOpen, setScreenModalOpen] = useState(false);
  const [screenCinemaId, setScreenCinemaId] = useState(() => cinemas[0]?.id || 1);
  const [screenName, setScreenName] = useState('Screen 3');
  const [screenType, setScreenType] = useState('IMAX');
  const [screenRows, setScreenRows] = useState(8);
  const [screenCols, setScreenCols] = useState(12);

  const selectedScreen = screens.find(s => s.id === Number(activeScreenId)) || screens[0];
  const screenSeats = getScreenSeats(selectedScreen);

  const handleAddCinema = (e) => {
    e.preventDefault();
    addCinema({ name: cinemaName, city, address, contact });
    setCinemaModalOpen(false);
    setCinemaName('');
    setAddress('');
  };

  const handleAddScreen = (e) => {
    e.preventDefault();
    const newScr = addScreen({
      cinemaId: Number(screenCinemaId),
      name: screenName,
      type: screenType,
      rows: Number(screenRows),
      cols: Number(screenCols)
    });
    setScreenModalOpen(false);
    setActiveScreenId(newScr.id);
  };

  return (
    <AdminLayout
      title="Cinema Branches &amp; Screen Layouts"
      subtitle="Manage physical branches, auditorium screens, and seating layout configurations."
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCinemaModalOpen(true)}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-3 py-2 rounded-xl text-xs border border-slate-700 transition-colors"
          >
            + Add Cinema Branch
          </button>
          <button
            onClick={() => setScreenModalOpen(true)}
            className="bg-amber-500 hover:bg-amber-400 text-black font-extrabold px-3.5 py-2 rounded-xl text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Auditorium Screen
          </button>
        </div>
      }
    >
      <div className="space-y-8">
        {/* Cinema Branches Table */}
        <div className="bg-[#111726] border border-[#1f2b42] rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="font-bold text-sm text-white flex items-center gap-2 border-b border-[#1f2b42] pb-3">
            <Building2 className="w-4 h-4 text-amber-400" />
            Cinema Branches Directory
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-500 border-b border-[#1f2b42]">
                  <th className="pb-3 font-semibold">ID</th>
                  <th className="pb-3 font-semibold">Cinema Name</th>
                  <th className="pb-3 font-semibold">City</th>
                  <th className="pb-3 font-semibold">Address</th>
                  <th className="pb-3 font-semibold">Contact Line</th>
                  <th className="pb-3 font-semibold">Active Screens</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f2b42]">
                {cinemas.map(c => {
                  const count = screens.filter(s => s.cinemaId === c.id).length;
                  return (
                    <tr key={c.id} className="hover:bg-[#182238]/40">
                      <td className="py-3 font-mono text-slate-500">#{c.id}</td>
                      <td className="py-3 font-bold text-white">{c.name}</td>
                      <td className="py-3 text-slate-300 font-medium">{c.city}</td>
                      <td className="py-3 text-slate-400">{c.address}</td>
                      <td className="py-3 text-slate-400 font-mono">{c.contact}</td>
                      <td className="py-3">
                        <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full font-bold">
                          {count} Screens
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Screens Table */}
        <div className="bg-[#111726] border border-[#1f2b42] rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="font-bold text-sm text-white flex items-center gap-2 border-b border-[#1f2b42] pb-3">
            <Armchair className="w-4 h-4 text-cyan-400" />
            Auditorium Screens &amp; Seating Capacity
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-500 border-b border-[#1f2b42]">
                  <th className="pb-3 font-semibold">Screen ID</th>
                  <th className="pb-3 font-semibold">Cinema Branch</th>
                  <th className="pb-3 font-semibold">Screen Name</th>
                  <th className="pb-3 font-semibold">Screen Type</th>
                  <th className="pb-3 font-semibold">Grid Geometry</th>
                  <th className="pb-3 font-semibold">Derived Capacity</th>
                  <th className="pb-3 font-semibold text-right">Preview Layout</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f2b42]">
                {screens.map(scr => {
                  const cin = cinemas.find(c => c.id === scr.cinemaId);
                  const cap = getScreenSeats(scr).length;
                  const isViewing = activeScreenId === scr.id;

                  return (
                    <tr key={scr.id} className={`hover:bg-[#182238]/40 ${isViewing ? 'bg-[#182238]/60' : ''}`}>
                      <td className="py-3 font-mono text-slate-500">#{scr.id}</td>
                      <td className="py-3 font-semibold text-white">{cin?.name}</td>
                      <td className="py-3 font-medium text-slate-300">{scr.name}</td>
                      <td className="py-3">
                        <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded text-[10px] font-semibold">
                          {scr.type}
                        </span>
                      </td>
                      <td className="py-3 text-slate-400 font-mono">
                        {scr.rows} rows × {scr.cols} cols
                      </td>
                      <td className="py-3 font-bold text-amber-400">{cap} Seats</td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => setActiveScreenId(scr.id)}
                          className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                            isViewing
                              ? 'bg-amber-500 text-black font-bold'
                              : 'bg-[#182238] hover:bg-slate-700 text-slate-200'
                          }`}
                        >
                          {isViewing ? 'Active Layout' : 'View Layout'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Visual Seat Layout Preview */}
        {selectedScreen && (
          <div className="bg-[#111726] border border-[#1f2b42] rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1f2b42] pb-4">
              <div>
                <h3 className="font-extrabold text-base text-white font-['Space_Grotesk'] flex items-center gap-2">
                  <Eye className="w-5 h-5 text-amber-400" />
                  Seat Layout Configuration — {selectedScreen.name} ({getScreenSeats(selectedScreen).length} Seats)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Type: {selectedScreen.type} • {selectedScreen.rows} rows, {selectedScreen.cols} columns
                </p>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded bg-[#1e293b] border border-[#334155]" />
                  Standard
                </span>
                <span className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded bg-[#1e3a8a] border border-[#2563eb]" />
                  Premium
                </span>
                <span className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded bg-[#78350f] border border-[#d97706]" />
                  VIP Recliner
                </span>
              </div>
            </div>

            {/* Visual Curved Screen */}
            <div className="cinema-screen-container">
              <div className="cinema-screen-curve" />
              <div className="screen-text">SCREEN POSITION</div>
            </div>

            {/* Layout Grid */}
            <div className="w-full overflow-x-auto py-4 flex flex-col items-center scrollbar-none">
              <div className="min-w-fit space-y-2.5">
                {Array.from({ length: selectedScreen.rows }, (_, r) => {
                  const rowLabel = String.fromCharCode(65 + r);
                  const rowSeats = screenSeats.filter(s => s.row === rowLabel);
                  const half = Math.floor(selectedScreen.cols / 2);

                  return (
                    <div key={rowLabel} className="flex items-center gap-2">
                      <span className="w-5 text-center font-bold text-xs text-slate-500 font-mono">
                        {rowLabel}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {rowSeats.map(seat => {
                          let cls = 'bg-[#1e293b] text-slate-400 border border-[#334155]';
                          if (seat.type === 'Premium') cls = 'bg-[#1e3a8a] text-blue-200 border border-[#2563eb]';
                          if (seat.type === 'VIP') cls = 'bg-[#78350f] text-amber-200 border border-[#d97706]';

                          return (
                            <React.Fragment key={seat.id}>
                              <div
                                title={`${seat.id} (${seat.type})`}
                                className={`w-7 h-7 rounded text-[10px] font-bold flex items-center justify-center cursor-default ${cls}`}
                              >
                                {seat.number}
                              </div>
                              {seat.number === half && <div className="w-6 shrink-0" />}
                            </React.Fragment>
                          );
                        })}
                      </div>
                      <span className="w-5 text-center font-bold text-xs text-slate-500 font-mono">
                        {rowLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Cinema Modal */}
      {cinemaModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111726] border border-[#23304a] rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-fade-in">
            <h3 className="font-bold text-white text-base">Add New Cinema Branch</h3>
            <form onSubmit={handleAddCinema} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-400 block mb-1">Cinema Branch Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CineMax Bahria Town"
                  value={cinemaName}
                  onChange={(e) => setCinemaName(e.target.value)}
                  className="w-full bg-[#182238] border border-[#23304a] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-400 block mb-1">City</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-[#182238] border border-[#23304a] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-400 block mb-1">Address</label>
                <input
                  type="text"
                  required
                  placeholder="Street / Plaza address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-[#182238] border border-[#23304a] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-400 block mb-1">Contact Phone</label>
                <input
                  type="text"
                  required
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className="w-full bg-[#182238] border border-[#23304a] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCinemaModalOpen(false)}
                  className="bg-slate-800 text-slate-300 px-4 py-2 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 text-black px-4 py-2 rounded-xl font-extrabold"
                >
                  Create Branch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Screen Modal */}
      {screenModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111726] border border-[#23304a] rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-fade-in">
            <h3 className="font-bold text-white text-base">Add Screen to Cinema</h3>
            <form onSubmit={handleAddScreen} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-400 block mb-1">Select Branch</label>
                <select
                  value={screenCinemaId}
                  onChange={(e) => setScreenCinemaId(e.target.value)}
                  className="w-full bg-[#182238] border border-[#23304a] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                >
                  {cinemas.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.city})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-400 block mb-1">Screen Name</label>
                  <input
                    type="text"
                    required
                    value={screenName}
                    onChange={(e) => setScreenName(e.target.value)}
                    className="w-full bg-[#182238] border border-[#23304a] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-400 block mb-1">Screen Type</label>
                  <select
                    value={screenType}
                    onChange={(e) => setScreenType(e.target.value)}
                    className="w-full bg-[#182238] border border-[#23304a] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="Standard">Standard</option>
                    <option value="3D">3D</option>
                    <option value="IMAX">IMAX</option>
                    <option value="VIP">VIP</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-400 block mb-1">Rows (A-Z)</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    required
                    value={screenRows}
                    onChange={(e) => setScreenRows(e.target.value)}
                    className="w-full bg-[#182238] border border-[#23304a] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-400 block mb-1">Seats Per Row</label>
                  <input
                    type="number"
                    min={4}
                    max={30}
                    required
                    value={screenCols}
                    onChange={(e) => setScreenCols(e.target.value)}
                    className="w-full bg-[#182238] border border-[#23304a] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-800/60 rounded-xl text-[11px] text-slate-400">
                Total seats automatically generated: <strong>{screenRows * screenCols} seats</strong>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setScreenModalOpen(false)}
                  className="bg-slate-800 text-slate-300 px-4 py-2 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 text-black px-4 py-2 rounded-xl font-extrabold"
                >
                  Create Screen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
