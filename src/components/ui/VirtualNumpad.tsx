'use client';

import React from 'react';
import { Delete, CornerDownLeft, Trash2, ChevronRight } from 'lucide-react';

interface VirtualNumpadProps {
  onDigitPress: (digit: string) => void;
  onBackspace: () => void;
  onClear: () => void;
  onSubmit: () => void;
  disabled?: boolean;
  isFeedbackActive?: boolean;
  userAnswer?: string;
}

export function VirtualNumpad({
  onDigitPress,
  onBackspace,
  onClear,
  onSubmit,
  disabled = false,
  isFeedbackActive = false,
  userAnswer = '',
}: VirtualNumpadProps) {
  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  const handleMouseDown = (e: React.MouseEvent) => {
    // Prevent focus loss from input when clicking numpad buttons
    e.preventDefault();
  };

  return (
    <div className="w-full max-w-[320px] mx-auto space-y-3 select-none">
      {/* Numpad Grid */}
      <div className="grid grid-cols-3 gap-2.5">
        {digits.map((digit) => (
          <button
            key={digit}
            type="button"
            disabled={disabled || isFeedbackActive}
            onMouseDown={handleMouseDown}
            onClick={() => onDigitPress(digit)}
            className={`h-14 sm:h-16 rounded-2xl text-2xl font-extrabold transition-all duration-150 flex items-center justify-center border shadow-sm ${
              disabled || isFeedbackActive
                ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed shadow-none'
                : 'bg-white hover:bg-teal-50/70 text-slate-800 border-slate-200/80 hover:border-teal-400 hover:text-teal-700 active:scale-95 active:bg-teal-100 shadow-slate-100'
            }`}
          >
            {digit}
          </button>
        ))}

        {/* Clear Button */}
        <button
          type="button"
          disabled={disabled || isFeedbackActive || !userAnswer}
          onMouseDown={handleMouseDown}
          onClick={onClear}
          title="Hapus Semua"
          className={`h-14 sm:h-16 rounded-2xl text-xs font-bold transition-all duration-150 flex flex-col items-center justify-center border shadow-sm ${
            disabled || isFeedbackActive || !userAnswer
              ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed shadow-none'
              : 'bg-amber-50/80 hover:bg-amber-100/80 text-amber-700 border-amber-200/80 hover:border-amber-400 active:scale-95 active:bg-amber-200'
          }`}
        >
          <Trash2 className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] uppercase font-black tracking-wider">Clear</span>
        </button>

        {/* 0 Button */}
        <button
          type="button"
          disabled={disabled || isFeedbackActive}
          onMouseDown={handleMouseDown}
          onClick={() => onDigitPress('0')}
          className={`h-14 sm:h-16 rounded-2xl text-2xl font-extrabold transition-all duration-150 flex items-center justify-center border shadow-sm ${
            disabled || isFeedbackActive
              ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed shadow-none'
              : 'bg-white hover:bg-teal-50/70 text-slate-800 border-slate-200/80 hover:border-teal-400 hover:text-teal-700 active:scale-95 active:bg-teal-100 shadow-slate-100'
          }`}
        >
          0
        </button>

        {/* Backspace Button */}
        <button
          type="button"
          disabled={disabled || isFeedbackActive || !userAnswer}
          onMouseDown={handleMouseDown}
          onClick={onBackspace}
          title="Hapus Satu Digit"
          className={`h-14 sm:h-16 rounded-2xl transition-all duration-150 flex flex-col items-center justify-center border shadow-sm ${
            disabled || isFeedbackActive || !userAnswer
              ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed shadow-none'
              : 'bg-rose-50/80 hover:bg-rose-100/80 text-rose-700 border-rose-200/80 hover:border-rose-400 active:scale-95 active:bg-rose-200'
          }`}
        >
          <Delete className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] uppercase font-black tracking-wider">Hapus</span>
        </button>
      </div>

      {/* Primary Action Button (Submit or Next) */}
      <div>
        {!isFeedbackActive ? (
          <button
            type="button"
            disabled={disabled || !userAnswer.trim()}
            onMouseDown={handleMouseDown}
            onClick={onSubmit}
            className={`w-full py-3.5 sm:py-4 font-extrabold rounded-2xl transition-all duration-150 flex items-center justify-center space-x-2 text-sm uppercase tracking-wider shadow-md ${
              disabled || !userAnswer.trim()
                ? 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white shadow-teal-500/25 active:scale-[0.98]'
            }`}
          >
            <span>Kirim Jawaban</span>
            <CornerDownLeft className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            disabled={disabled}
            onMouseDown={handleMouseDown}
            onClick={onSubmit}
            className="w-full py-3.5 sm:py-4 bg-slate-800 hover:bg-slate-900 active:scale-[0.98] text-white font-extrabold rounded-2xl shadow-md transition-all text-sm uppercase tracking-wider flex items-center justify-center space-x-1.5"
          >
            <span>Lanjut Soal Berikutnya</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
