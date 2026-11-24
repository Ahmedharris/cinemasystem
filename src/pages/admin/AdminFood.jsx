import React, { useState } from 'react';
import { Popcorn, Plus, Edit2, Trash2, CheckCircle2, XCircle, X } from 'lucide-react';
import { useCinema } from '../../context/CinemaContext';
import { CURRENCY } from '../../data/initialData';
import AdminLayout from '../../components/AdminLayout';

export default function AdminFood() {
  const { foodItems, addFoodItem, updateFoodItem, deleteFoodItem, toggleFoodAvailability } = useCinema();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [price, setPrice] = useState(500);
  const [category, setCategory] = useState('Snacks');
  const [calories, setCalories] = useState('450 kcal');
  const [icon, setIcon] = useState('🍿');

  const openAddModal = () => {
    setEditingItemId(null);
    setName('');
    setDesc('');
    setPrice(500);
    setCategory('Snacks');
    setCalories('450 kcal');
    setIcon('🍿');
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItemId(item.id);
    setName(item.name);
    setDesc(item.desc);
    setPrice(item.price);
    setCategory(item.category);
    setCalories(item.calories || '');
    setIcon(item.icon || '🍿');
    setModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      name,
      desc,
      price: Number(price),
      category,
      calories,
      icon
    };

    if (editingItemId) {
      updateFoodItem(editingItemId, data);
    } else {
      addFoodItem(data);
    }

    setModalOpen(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this food item from concessions inventory?')) {
      deleteFoodItem(id);
    }
  };

  return (
    <AdminLayout
      title="Concessions &amp; Refreshments Menu"
      subtitle="Manage cinema food and drink inventory, pricing, categories, and real-time stock availability."
      actions={
        <button
          onClick={openAddModal}
          className="bg-amber-500 hover:bg-amber-400 text-black font-extrabold px-3.5 py-2 rounded-xl text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Add Food Item
        </button>
      }
    >
      <div className="bg-[#111726] border border-[#1f2b42] rounded-3xl p-6 shadow-xl space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-500 border-b border-[#1f2b42]">
                <th className="pb-3 font-semibold">Item</th>
                <th className="pb-3 font-semibold">Category</th>
                <th className="pb-3 font-semibold">Description</th>
                <th className="pb-3 font-semibold">Calories</th>
                <th className="pb-3 font-semibold">Price</th>
                <th className="pb-3 font-semibold">Stock Availability</th>
                <th className="pb-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f2b42]">
              {foodItems.map(item => (
                <tr key={item.id} className="hover:bg-[#182238]/40">
                  <td className="py-3 font-bold text-white flex items-center gap-2.5">
                    <span className="text-xl p-1 bg-[#182238] rounded-lg">{item.icon || '🍿'}</span>
                    <span>{item.name}</span>
                  </td>
                  <td className="py-3">
                    <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px] font-semibold">
                      {item.category}
                    </span>
                  </td>
                  <td className="py-3 text-slate-400 max-w-xs truncate">{item.desc}</td>
                  <td className="py-3 text-slate-400">{item.calories || '—'}</td>
                  <td className="py-3 font-mono font-bold text-amber-400">
                    {CURRENCY} {item.price}
                  </td>
                  <td className="py-3">
                    <button
                      onClick={() => toggleFoodAvailability(item.id)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase flex items-center gap-1.5 transition-all ${
                        item.available
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                          : 'bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30'
                      }`}
                      title="Click to toggle stock status"
                    >
                      {item.available ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {item.available ? 'In Stock (Click to toggle)' : 'Sold Out (Click to toggle)'}
                    </button>
                  </td>
                  <td className="py-3 text-right space-x-1.5">
                    <button
                      onClick={() => openEditModal(item)}
                      className="bg-[#182238] hover:bg-slate-700 text-slate-200 p-1.5 rounded-lg transition-colors inline-flex"
                      title="Edit Item"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="bg-red-500/10 hover:bg-red-500/20 text-red-400 p-1.5 rounded-lg transition-colors inline-flex border border-red-500/20"
                      title="Delete Item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Food Item Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111726] border border-[#23304a] rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-[#23304a] pb-3">
              <h3 className="font-bold text-white text-base">
                {editingItemId ? 'Edit Food Item' : 'Add Concession Item'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-400 block mb-1">Item Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cheese Popcorn (Medium)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#182238] border border-[#23304a] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-400 block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#182238] border border-[#23304a] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="Snacks">Snacks</option>
                    <option value="Drinks">Drinks</option>
                    <option value="Meals">Meals</option>
                    <option value="Combos">Combos</option>
                    <option value="Desserts">Desserts</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-400 block mb-1">Icon / Emoji</label>
                  <input
                    type="text"
                    required
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    className="w-full bg-[#182238] border border-[#23304a] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-400 block mb-1">Price (Rs.)</label>
                  <input
                    type="number"
                    required
                    min={10}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-[#182238] border border-[#23304a] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-400 block mb-1">Calories</label>
                  <input
                    type="text"
                    placeholder="e.g. 500 kcal"
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                    className="w-full bg-[#182238] border border-[#23304a] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-400 block mb-1">Description</label>
                <textarea
                  rows={3}
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className="w-full bg-[#182238] border border-[#23304a] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#23304a]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="bg-slate-800 text-slate-300 px-4 py-2 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 text-black px-4 py-2 rounded-xl font-extrabold"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
