import React, { useState } from 'react';
import { Film, Plus, Edit2, Trash2, Search, AlertCircle, X, Check } from 'lucide-react';
import { useCinema } from '../../context/CinemaContext';
import AdminLayout from '../../components/AdminLayout';

export default function AdminMovies() {
  const { movies, genres, addMovie, updateMovie, deleteMovie, addGenre } = useCinema();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMovieId, setEditingMovieId] = useState(null);

  // Form State
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState(120);
  const [release, setRelease] = useState('');
  const [language, setLanguage] = useState('English');
  const [rating, setRating] = useState('PG-13');
  const [status, setStatus] = useState('NOW_SHOWING');
  const [synopsis, setSynopsis] = useState('');
  const [selectedGenreIds, setSelectedGenreIds] = useState([]);
  const [poster, setPoster] = useState('');

  // New genre prompt state
  const [newGenreName, setNewGenreName] = useState('');
  const [genreModalOpen, setGenreModalOpen] = useState(false);

  const openAddModal = () => {
    setEditingMovieId(null);
    setTitle('');
    setDuration(120);
    setRelease(new Date().toISOString().split('T')[0]);
    setLanguage('English');
    setRating('PG-13');
    setStatus('NOW_SHOWING');
    setSynopsis('');
    setSelectedGenreIds([genres[0]?.id || 1]);
    setPoster('https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80');
    setModalOpen(true);
  };

  const openEditModal = (m) => {
    setEditingMovieId(m.id);
    setTitle(m.title);
    setDuration(m.duration);
    setRelease(m.release);
    setLanguage(m.language);
    setRating(m.rating);
    setStatus(m.status);
    setSynopsis(m.synopsis || '');
    setSelectedGenreIds(m.genres || []);
    setPoster(m.poster || '');
    setModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedGenreIds.length) {
      alert('Please select at least one genre.');
      return;
    }

    const movieData = {
      title,
      duration: Number(duration),
      release,
      language,
      rating,
      status,
      synopsis,
      genres: selectedGenreIds,
      poster
    };

    if (editingMovieId) {
      updateMovie(editingMovieId, movieData);
    } else {
      addMovie(movieData);
    }

    setModalOpen(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this movie?')) {
      const res = deleteMovie(id);
      if (!res.success && res.archived) {
        alert(res.message);
      }
    }
  };

  const handleCreateGenre = (e) => {
    e.preventDefault();
    if (!newGenreName.trim()) return;
    const res = addGenre(newGenreName);
    if (!res.success) {
      alert(res.message);
    } else {
      setNewGenreName('');
      setGenreModalOpen(false);
    }
  };

  const filteredMovies = movies.filter(m => {
    if (searchQuery && !m.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (statusFilter && m.status !== statusFilter) return false;
    return true;
  });

  return (
    <AdminLayout
      title="Movie Catalogue &amp; Genres"
      subtitle="Manage cinema titles, classifications, genre mappings, and release statuses."
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => setGenreModalOpen(true)}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-3 py-2 rounded-xl text-xs border border-slate-700 transition-colors"
          >
            + Add Genre
          </button>
          <button
            onClick={openAddModal}
            className="bg-amber-500 hover:bg-amber-400 text-black font-extrabold px-3.5 py-2 rounded-xl text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Movie
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Filters Toolbar */}
        <div className="bg-[#111726] border border-[#1f2b42] p-4 rounded-2xl flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search movies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#182238] border border-[#23304a] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#182238] border border-[#23304a] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
          >
            <option value="">All Statuses</option>
            <option value="NOW_SHOWING">Now Showing</option>
            <option value="COMING_SOON">Coming Soon</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>

        {/* Movies Data Table */}
        <div className="bg-[#111726] border border-[#1f2b42] rounded-3xl p-6 shadow-xl space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-500 border-b border-[#1f2b42]">
                  <th className="pb-3 font-semibold">ID</th>
                  <th className="pb-3 font-semibold">Movie</th>
                  <th className="pb-3 font-semibold">Genres</th>
                  <th className="pb-3 font-semibold">Duration</th>
                  <th className="pb-3 font-semibold">Language</th>
                  <th className="pb-3 font-semibold">Rating</th>
                  <th className="pb-3 font-semibold">Release Date</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f2b42]">
                {filteredMovies.map(m => {
                  const mGenres = (m.genres || []).map(gid => genres.find(g => g.id === gid)?.name).filter(Boolean);

                  return (
                    <tr key={m.id} className="hover:bg-[#182238]/40">
                      <td className="py-3 font-mono text-slate-500">#{m.id}</td>
                      <td className="py-3 font-bold text-white flex items-center gap-2">
                        <span>{m.emoji || '🎬'}</span>
                        <span>{m.title}</span>
                      </td>
                      <td className="py-3 text-slate-400">{mGenres.join(', ')}</td>
                      <td className="py-3 text-slate-300 font-mono">{m.duration} min</td>
                      <td className="py-3 text-slate-300">{m.language}</td>
                      <td className="py-3">
                        <span className="bg-slate-800 text-amber-400 border border-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">
                          {m.rating}
                        </span>
                      </td>
                      <td className="py-3 text-slate-400">{m.release}</td>
                      <td className="py-3">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                            m.status === 'NOW_SHOWING'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : m.status === 'COMING_SOON'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-slate-700 text-slate-400'
                          }`}
                        >
                          {m.status}
                        </span>
                      </td>
                      <td className="py-3 text-right space-x-1.5">
                        <button
                          onClick={() => openEditModal(m)}
                          className="bg-[#182238] hover:bg-slate-700 text-slate-200 p-1.5 rounded-lg transition-colors inline-flex"
                          title="Edit Movie"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(m.id)}
                          className="bg-red-500/10 hover:bg-red-500/20 text-red-400 p-1.5 rounded-lg transition-colors inline-flex border border-red-500/20"
                          title="Delete / Archive Movie"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Genres Manager Strip */}
        <div className="bg-[#111726] border border-[#1f2b42] rounded-3xl p-6 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-[#1f2b42] pb-3">
            <h3 className="font-bold text-sm text-white">Active Genres in Database</h3>
            <span className="text-[11px] text-slate-500">M:N relation mapped via Movie_Genre</span>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {genres.map(g => {
              const count = movies.filter(m => (m.genres || []).includes(g.id)).length;
              return (
                <span
                  key={g.id}
                  className="bg-[#182238] text-slate-300 border border-[#23304a] px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  <span>{g.name}</span>
                  <span className="bg-slate-800 text-amber-400 px-1.5 py-0.2 rounded text-[10px]">
                    {count}
                  </span>
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Add / Edit Movie Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111726] border border-[#23304a] rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#23304a] pb-3">
              <h3 className="font-bold text-white text-base">
                {editingMovieId ? 'Edit Movie' : 'Add New Movie to Catalogue'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-400 block mb-1">Movie Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#182238] border border-[#23304a] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-400 block mb-1">Duration (minutes)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full bg-[#182238] border border-[#23304a] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-400 block mb-1">Release Date</label>
                  <input
                    type="date"
                    required
                    value={release}
                    onChange={(e) => setRelease(e.target.value)}
                    className="w-full bg-[#182238] border border-[#23304a] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-400 block mb-1">Language</label>
                  <input
                    type="text"
                    required
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full bg-[#182238] border border-[#23304a] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-400 block mb-1">Rating</label>
                  <select
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                    className="w-full bg-[#182238] border border-[#23304a] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="G">G</option>
                    <option value="PG">PG</option>
                    <option value="PG-13">PG-13</option>
                    <option value="R">R</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-400 block mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-[#182238] border border-[#23304a] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="NOW_SHOWING">NOW SHOWING</option>
                    <option value="COMING_SOON">COMING SOON</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-400 block mb-1.5">
                  Select Genres (Multi-select)
                </label>
                <div className="flex flex-wrap gap-2">
                  {genres.map(g => {
                    const isSelected = selectedGenreIds.includes(g.id);
                    return (
                      <button
                        type="button"
                        key={g.id}
                        onClick={() => {
                          setSelectedGenreIds(prev =>
                            prev.includes(g.id) ? prev.filter(x => x !== g.id) : [...prev, g.id]
                          );
                        }}
                        className={`px-3 py-1 rounded-xl text-xs font-semibold border transition-all ${
                          isSelected
                            ? 'bg-amber-500 text-black border-amber-400 font-bold'
                            : 'bg-[#182238] text-slate-400 border-[#23304a]'
                        }`}
                      >
                        {g.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-400 block mb-1">Poster Image URL</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={poster}
                  onChange={(e) => setPoster(e.target.value)}
                  className="w-full bg-[#182238] border border-[#23304a] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-400 block mb-1">Synopsis</label>
                <textarea
                  rows={3}
                  value={synopsis}
                  onChange={(e) => setSynopsis(e.target.value)}
                  className="w-full bg-[#182238] border border-[#23304a] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="pt-3 border-t border-[#23304a] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-2 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-400 text-black font-extrabold px-5 py-2 rounded-xl"
                >
                  Save Movie
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Genre Modal */}
      {genreModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111726] border border-[#23304a] rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl animate-fade-in">
            <h3 className="font-bold text-white text-base">Add New Genre</h3>
            <form onSubmit={handleCreateGenre} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-400 block mb-1">Genre Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mystery, Fantasy, Documentary"
                  value={newGenreName}
                  onChange={(e) => setNewGenreName(e.target.value)}
                  className="w-full bg-[#182238] border border-[#23304a] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setGenreModalOpen(false)}
                  className="bg-slate-800 text-slate-300 px-4 py-2 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 text-black px-4 py-2 rounded-xl font-bold"
                >
                  Create Genre
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
