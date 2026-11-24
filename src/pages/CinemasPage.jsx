import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, MapPin, Phone, Tv, Sparkles, ArrowRight } from 'lucide-react';
import { useCinema } from '../context/CinemaContext';
import { getScreenSeats } from '../data/initialData';

export default function CinemasPage() {
  const { cinemas, screens } = useCinema();

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="border-b border-[#23304a] pb-4">
        <h1 className="text-2xl font-extrabold text-white font-['Space_Grotesk'] flex items-center gap-2.5">
          <Building2 className="w-6 h-6 text-amber-400" />
          Our Cinema Branches
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Explore CineMax flagship locations across Pakistan featuring next-generation laser projection and acoustics.
        </p>
      </div>

      {/* Cinemas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {cinemas.map(cinema => {
          const cinemaScreens = screens.filter(s => s.cinemaId === cinema.id);

          return (
            <div
              key={cinema.id}
              className="bg-[#111726] border border-[#23304a] rounded-3xl overflow-hidden hover:border-amber-400/50 transition-all shadow-xl flex flex-col justify-between"
            >
              <div>
                {/* Branch Image */}
                <div className="h-48 relative overflow-hidden bg-slate-900">
                  <img
                    src={cinema.image}
                    alt={cinema.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#111726] via-transparent to-black/30" />
                  <span className="absolute top-3 right-3 bg-amber-500 text-black font-extrabold text-[11px] px-3 py-1 rounded-full uppercase">
                    {cinema.city}
                  </span>
                </div>

                {/* Body Info */}
                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-white font-['Space_Grotesk']">
                      {cinema.name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>{cinema.address}, {cinema.city}</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{cinema.contact}</span>
                    </p>
                  </div>

                  {/* Amenities */}
                  <div className="space-y-1.5 pt-2 border-t border-[#23304a]">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Amenities &amp; Sound
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {cinema.amenities?.map((a, i) => (
                        <span
                          key={i}
                          className="bg-[#182238] text-amber-300 text-[10px] font-semibold px-2 py-0.5 rounded border border-[#23304a]"
                        >
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Screens Breakdown */}
                  <div className="space-y-2 pt-2 border-t border-[#23304a]">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Screens ({cinemaScreens.length})
                    </span>
                    <div className="space-y-1.5">
                      {cinemaScreens.map(scr => (
                        <div
                          key={scr.id}
                          className="flex items-center justify-between text-xs p-2 rounded-xl bg-[#182238]/60 border border-[#23304a]"
                        >
                          <span className="font-semibold text-white">{scr.name}</span>
                          <span className="text-[11px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/30">
                            {scr.type} • {getScreenSeats(scr).length} Seats
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* View Movies Link */}
              <div className="p-6 pt-0">
                <Link
                  to="/"
                  className="w-full bg-[#182238] hover:bg-amber-500 hover:text-black text-slate-200 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all border border-[#23304a] hover:border-amber-400"
                >
                  View Movies at this Branch
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
