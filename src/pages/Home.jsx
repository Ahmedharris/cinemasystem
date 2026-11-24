import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Sparkles, Filter, Film, Play, Calendar, Star, Ticket } from 'lucide-react';
import { useCinema } from '../context/CinemaContext';
import MovieCard from '../components/MovieCard';

export default function Home() {
  const { movies, genres } = useCinema();

  const [activeTab, setActiveTab] = useState('NOW_SHOWING');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [selectedRating, setSelectedRating] = useState('');
  const [sortBy, setSortBy] = useState('release');

  const featuredMovie = movies.find(m => m.featured && m.status === 'NOW_SHOWING') || movies[0];

  const languages = [...new Set(movies.map(m => m.language))];
  const ratings = [...new Set(movies.map(m => m.rating))];

  // Filter & Sort Logic
  const filteredMovies = movies.filter(m => {
    if (m.status !== activeTab) return false;
    if (searchQuery && !m.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (selectedGenre && !m.genres.includes(Number(selectedGenre))) return false;
    if (selectedLanguage && m.language !== selectedLanguage) return false;
    if (selectedRating && m.rating !== selectedRating) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === 'duration') return b.duration - a.duration;
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    return new Date(b.release) - new Date(a.release);
  });

  return (
    <div className="space-y-12">
      {/* Cinematic Hero Section */}
      {featuredMovie && (
        <section className="relative w-full rounded-3xl overflow-hidden min-h-[460px] md:min-h-[520px] flex items-end p-6 md:p-12 border border-[#23304a] shadow-2xl bg-slate-900">
          {/* Backdrop Image */}
          <img
            src={featuredMovie.backdrop || featuredMovie.poster}
            alt={featuredMovie.title}
            className="absolute inset-0 w-full h-full object-cover object-center scale-105 filter brightness-75 contrast-125"
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#090d16] via-[#090d16]/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#090d16]/90 via-transparent to-transparent" />

          {/* Hero Content */}
          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 bg-amber-500/20 backdrop-blur-md border border-amber-500/40 text-amber-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> Featured Spotlight
            </div>

            <h1 className="text-3xl md:text-5xl font-extrabold text-white font-['Space_Grotesk'] tracking-tight leading-tight">
              {featuredMovie.title}
            </h1>

            <p className="text-sm md:text-base text-slate-300 leading-relaxed line-clamp-3">
              {featuredMovie.synopsis}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                to={`/movie/${featuredMovie.id}`}
                className="bg-amber-500 hover:bg-amber-400 text-black font-extrabold px-6 py-3 rounded-xl flex items-center gap-2 text-sm shadow-xl shadow-amber-500/30 transition-all hover:scale-105"
              >
                <Ticket className="w-4 h-4" /> Book Tickets Now
              </Link>

              <Link
                to={`/movie/${featuredMovie.id}`}
                className="bg-slate-900/80 hover:bg-slate-800 text-white font-semibold px-5 py-3 rounded-xl flex items-center gap-2 text-sm border border-slate-700 backdrop-blur-md transition-all"
              >
                <Play className="w-4 h-4 text-amber-400 fill-amber-400" /> Watch Trailer
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Main Movie Catalog Section */}
      <section className="space-y-6">
        {/* Tab Switcher & Section Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#23304a] pb-4">
          <div>
            <h2 className="text-2xl font-extrabold text-white font-['Space_Grotesk']">
              Movies at CineMax
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Select a movie to browse showtimes, reserve seats, and order food.
            </p>
          </div>

          {/* Now Showing vs Coming Soon Tabs */}
          <div className="flex items-center gap-2 bg-[#111726] p-1.5 rounded-2xl border border-[#23304a] self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('NOW_SHOWING')}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'NOW_SHOWING'
                  ? 'bg-amber-500 text-black shadow-md shadow-amber-500/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Now Showing ({movies.filter(m => m.status === 'NOW_SHOWING').length})
            </button>
            <button
              onClick={() => setActiveTab('COMING_SOON')}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'COMING_SOON'
                  ? 'bg-amber-500 text-black shadow-md shadow-amber-500/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Coming Soon ({movies.filter(m => m.status === 'COMING_SOON').length})
            </button>
          </div>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="bg-[#111726] border border-[#23304a] p-4 rounded-2xl flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#182238] border border-[#23304a] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Genre Filter */}
          <select
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
            className="bg-[#182238] border border-[#23304a] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
          >
            <option value="">All Genres</option>
            {genres.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>

          {/* Language Filter */}
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="bg-[#182238] border border-[#23304a] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
          >
            <option value="">All Languages</option>
            {languages.map(l => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>

          {/* Rating Filter */}
          <select
            value={selectedRating}
            onChange={(e) => setSelectedRating(e.target.value)}
            className="bg-[#182238] border border-[#23304a] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
          >
            <option value="">All Ratings</option>
            {ratings.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-[#182238] border border-[#23304a] rounded-xl px-3 py-2 text-xs text-amber-400 font-medium focus:outline-none focus:border-amber-400"
          >
            <option value="release">Release Date</option>
            <option value="duration">Runtime Duration</option>
            <option value="title">Alphabetical</option>
          </select>
        </div>

        {/* Movies Grid */}
        {filteredMovies.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {filteredMovies.map(movie => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-[#111726]/50 border border-dashed border-[#23304a] rounded-3xl space-y-3">
            <Film className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">No movies match your filter</h3>
            <p className="text-xs text-slate-400">Try adjusting your search criteria or clearing filters.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedGenre('');
                setSelectedLanguage('');
                setSelectedRating('');
              }}
              className="mt-2 bg-amber-500/20 text-amber-300 border border-amber-500/30 px-4 py-2 rounded-xl text-xs font-semibold hover:bg-amber-500/30 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
