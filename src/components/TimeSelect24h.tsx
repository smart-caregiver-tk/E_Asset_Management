'use client';

import React from 'react';

/**
 * TimeSelect24h — Custom 24-hour time selector
 * Replaces <input type="time"> to avoid browser locale AM/PM display.
 * Value is stored and returned as "HH:MM" string (same as native time input).
 */
interface TimeSelect24hProps {
  value: string;                      // "HH:MM" or "" 
  onChange: (val: string) => void;    // returns "HH:MM"
  required?: boolean;
  className?: string;
  id?: string;
}

export default function TimeSelect24h({ value, onChange, required, className, id }: TimeSelect24hProps) {
  // Parse current value
  const [hh, mm] = value ? value.split(':') : ['', ''];
  const currentHour = hh || '';
  const currentMin = mm || '';

  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  const handleHourChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newHour = e.target.value;
    if (!newHour) {
      onChange('');
      return;
    }
    onChange(`${newHour}:${currentMin || '00'}`);
  };

  const handleMinChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMin = e.target.value;
    onChange(`${currentHour || '00'}:${newMin}`);
  };

  const selectStyle: React.CSSProperties = {
    height: '38px',
    border: '1px solid var(--border-color, #d1d5db)',
    borderRadius: '6px',
    padding: '0 8px',
    fontSize: '0.9rem',
    background: 'var(--bg-white, #fff)',
    color: 'var(--text-dark, #111)',
    cursor: 'pointer',
    outline: 'none',
  };

  return (
    <div
      id={id}
      className={className}
      style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
    >
      <select
        value={currentHour}
        onChange={handleHourChange}
        required={required}
        style={{ ...selectStyle, flex: '1' }}
        aria-label="ชั่วโมง (24h)"
      >
        <option value="">ชม.</option>
        {hours.map(h => (
          <option key={h} value={h}>{h}</option>
        ))}
      </select>
      <span style={{ fontWeight: 700, color: 'var(--text-mid, #555)', fontSize: '1.1rem', lineHeight: 1 }}>:</span>
      <select
        value={currentMin}
        onChange={handleMinChange}
        style={{ ...selectStyle, flex: '1' }}
        aria-label="นาที"
      >
        <option value="">นาที</option>
        {minutes.map(m => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>
      <span style={{ fontSize: '0.8rem', color: 'var(--text-light, #888)', whiteSpace: 'nowrap' }}>น.</span>
    </div>
  );
}
