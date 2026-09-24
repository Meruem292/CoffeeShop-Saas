import React, { useState } from 'react';
import { FlaskConical, CheckCircle2, Circle, X, Printer, Layers, Scale, Sparkles, AlertCircle } from 'lucide-react';
import { CartItem, YourMixRecipeItem } from '../types';

interface BaristaRecipeGuideModalProps {
  item: CartItem;
  orderId?: string;
  customerName?: string;
  onClose: () => void;
}

export function BaristaRecipeGuideModal({
  item,
  orderId,
  customerName,
  onClose
}: BaristaRecipeGuideModalProps) {
  const details = item.customMixDetails;
  const ingredients: YourMixRecipeItem[] = details?.ingredients || [];

  // Track completed steps by ingredient ID
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});

  const toggleStep = (id: string) => {
    setCompletedSteps(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Group ingredients by pouring category order
  const categoriesOrder: { category: string; title: string; icon: string; items: YourMixRecipeItem[] }[] = [
    {
      category: 'bottom_solid',
      title: 'Step 1: Bottom Cup Toppings & Boba',
      icon: '🧋',
      items: ingredients.filter(i => i.layerType === 'bottom_solid')
    },
    {
      category: 'sweetener_syrup',
      title: 'Step 2: Syrups, Concentrates & Powders',
      icon: '🍯',
      items: ingredients.filter(i => i.category === 'sweetener_syrup' || i.category === 'powder_flavor' || i.layerType === 'powder')
    },
    {
      category: 'base_liquid',
      title: 'Step 3: Base Liquids & Espresso / Tea Shots',
      icon: '☕',
      items: ingredients.filter(i => i.category === 'base_liquid')
    },
    {
      category: 'dairy_milk',
      title: 'Step 4: Dairy / Plant Milk Fill',
      icon: '🥛',
      items: ingredients.filter(i => i.category === 'dairy_milk')
    },
    {
      category: 'ice',
      title: 'Step 5: Ice Level',
      icon: '🧊',
      items: ingredients.filter(i => i.layerType === 'ice' || i.category === 'ice_temp')
    },
    {
      category: 'foam',
      title: 'Step 6: Top Foams, Whipped Cream & Toppings',
      icon: '👑',
      items: ingredients.filter(i => i.layerType === 'foam' || i.layerType === 'top_solid')
    }
  ].filter(group => group.items.length > 0);

  const totalStepsCount = ingredients.length;
  const completedCount = Object.values(completedSteps).filter(Boolean).length;
  const isFullyPrepared = totalStepsCount > 0 && completedCount === totalStepsCount;

  // Print Barista Ticket Handler
  const handlePrintTicket = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-white/15 rounded-3xl max-w-2xl w-full text-slate-100 flex flex-col max-h-[90vh] overflow-hidden shadow-2xl relative">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-slate-950 border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-black">
              <FlaskConical className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500 text-slate-950">
                  Your MIX Formula Ticket
                </span>
                {orderId && (
                  <span className="text-xs font-mono font-bold text-slate-400">
                    Order #{orderId.slice(-6)}
                  </span>
                )}
              </div>
              <h2 className="text-lg font-black text-white mt-0.5">
                {item.name}
              </h2>
              {customerName && (
                <p className="text-xs text-slate-400">
                  Guest: <strong>{customerName}</strong>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintTicket}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-all"
              title="Print Barista Formula Ticket"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Preparation Status Progress Banner */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between transition-colors ${
            isFullyPrepared 
              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' 
              : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
          }`}>
            <div className="flex items-center gap-3">
              {isFullyPrepared ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-6 h-6 text-amber-400 shrink-0" />
              )}
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider">
                  {isFullyPrepared ? 'Formula 100% Fully Formulated!' : 'Barista Preparation Checklist'}
                </h4>
                <p className="text-[11px] text-slate-300">
                  {completedCount} of {totalStepsCount} ingredients added into cup vessel
                </p>
              </div>
            </div>

            <span className="font-mono text-xs font-black px-3 py-1 rounded-xl bg-black/40 border border-white/10">
              {Math.round((completedCount / (totalStepsCount || 1)) * 100)}%
            </span>
          </div>

          {/* Drink Specs Summary */}
          {details && (
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-center">
                <span className="text-[9px] font-black uppercase text-slate-400 block">Vessel Capacity</span>
                <span className="text-xs font-black text-amber-400 font-mono mt-0.5 block">
                  {details.totalVolumeOz} / {details.capacityOz} oz
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-center">
                <span className="text-[9px] font-black uppercase text-slate-400 block">Preset Base</span>
                <span className="text-xs font-black text-cyan-400 truncate mt-0.5 block">
                  {details.basePresetName || 'From Scratch'}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-center">
                <span className="text-[9px] font-black uppercase text-slate-400 block">Nutritional Est.</span>
                <span className="text-xs font-black text-emerald-400 font-mono mt-0.5 block">
                  {details.estimatedCaffeineMg || 0}mg Caf
                </span>
              </div>
            </div>
          )}

          {/* Step-by-Step Barista Preparation Steps */}
          <div className="space-y-4">
            <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest block">
              Sequential Pouring & Dosing Order:
            </span>

            {categoriesOrder.map((group, gIdx) => (
              <div key={gIdx} className="p-4 rounded-2xl bg-slate-950 border border-white/10 space-y-3">
                <div className="flex items-center gap-2 text-xs font-black text-white uppercase tracking-wider">
                  <span>{group.icon}</span>
                  <span>{group.title}</span>
                </div>

                <div className="space-y-2">
                  {group.items.map(ing => {
                    const isChecked = !!completedSteps[ing.id];
                    const measure = ing.measureGrams ? `${ing.measureGrams} g/ml` : `${ing.quantity * 15} ml`;

                    return (
                      <div
                        key={ing.id}
                        onClick={() => toggleStep(ing.id)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          isChecked
                            ? 'bg-emerald-500/10 border-emerald-500/40 opacity-75'
                            : 'bg-white/5 border-white/5 hover:border-amber-500/40'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <button type="button" className="text-amber-400">
                            {isChecked ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                            ) : (
                              <Circle className="w-5 h-5 text-slate-500" />
                            )}
                          </button>

                          <div className="flex items-center gap-2.5">
                            <span 
                              className="w-3 h-3 rounded-full border border-white/20" 
                              style={{ backgroundColor: ing.color || '#3E2723' }}
                            />
                            <span className={`text-xs font-black ${isChecked ? 'line-through text-slate-400' : 'text-white'}`}>
                              {ing.name}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="px-2.5 py-1 rounded-lg bg-black/60 text-amber-400 text-xs font-mono font-black border border-white/10">
                            {ing.quantity} {ing.unit}
                          </span>
                          <span className="text-[10px] font-mono text-cyan-400 font-bold">
                            ({measure})
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Full Text Recipe Guide */}
          {item.mixtureGuide && (
            <div className="p-4 rounded-2xl bg-black/50 border border-white/10 space-y-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                Full Ticket Summary Text:
              </span>
              <pre className="text-[11px] font-mono text-slate-300 whitespace-pre-wrap leading-relaxed">
                {item.mixtureGuide}
              </pre>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-white/10 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-400 font-medium">
            CoffeeShop SaaS — Laboratory Preparation Guide
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all"
          >
            Close Ticket Guide
          </button>
        </div>
      </div>
    </div>
  );
}
