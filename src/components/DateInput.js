import React, { useState, useEffect, useRef } from 'react';

export function isoToDisplay(isoStr) {
  if (!isoStr || typeof isoStr !== 'string') return '';
  const trimmed = isoStr.trim();
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
    const [d, m, y] = trimmed.split('/');
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }
  const ymdMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (ymdMatch) {
    const [, y, m, d] = ymdMatch;
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }
  return trimmed;
}

export function displayToIso(displayStr) {
  if (!displayStr || typeof displayStr !== 'string') return '';
  const clean = displayStr.trim().replace(/[-.]/g, '/');
  const parts = clean.split('/');
  if (parts.length === 3) {
    const [d, m, y] = parts;
    if (d && m && y && y.length === 4) {
      const day = parseInt(d, 10);
      const month = parseInt(m, 10);
      const year = parseInt(y, 10);
      if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= 2100) {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
    }
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    return clean;
  }
  return '';
}

export default function DateInput({
  name,
  value,
  onChange,
  required = false,
  className = 'form-control',
  placeholder = 'dd/mm/yyyy',
  id,
  style = {}
}) {
  const [displayText, setDisplayText] = useState(() => isoToDisplay(value));
  const nativePickerRef = useRef(null);

  useEffect(() => {
    setDisplayText(isoToDisplay(value));
  }, [value]);

  const handleTextChange = (e) => {
    let inputVal = e.target.value.replace(/[^\d/]/g, '');

    if (inputVal.length === 2 && !inputVal.includes('/')) {
      inputVal = inputVal + '/';
    } else if (inputVal.length === 5 && (inputVal.match(/\//g) || []).length === 1) {
      inputVal = inputVal + '/';
    }

    if (inputVal.length > 10) {
      inputVal = inputVal.slice(0, 10);
    }

    setDisplayText(inputVal);

    const iso = displayToIso(inputVal);
    if (iso) {
      if (onChange) {
        onChange({ target: { name, value: iso } });
      }
    } else if (inputVal === '') {
      if (onChange) {
        onChange({ target: { name, value: '' } });
      }
    }
  };

  const handleBlur = () => {
    const iso = displayToIso(displayText);
    if (iso) {
      setDisplayText(isoToDisplay(iso));
      if (onChange) {
        onChange({ target: { name, value: iso } });
      }
    } else if (displayText.trim() !== '') {
      setDisplayText(isoToDisplay(value));
    }
  };

  const handleNativePickerChange = (e) => {
    const pickedIso = e.target.value;
    if (pickedIso) {
      setDisplayText(isoToDisplay(pickedIso));
      if (onChange) {
        onChange({ target: { name, value: pickedIso } });
      }
    }
  };

  const openCalendar = () => {
    if (nativePickerRef.current) {
      try {
        if (typeof nativePickerRef.current.showPicker === 'function') {
          nativePickerRef.current.showPicker();
        } else {
          nativePickerRef.current.focus();
        }
      } catch (err) {
        nativePickerRef.current.focus();
      }
    }
  };

  const currentIso = displayToIso(displayText) || value || '';

  return (
    <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
      <input
        type="text"
        id={id}
        name={name}
        required={required}
        placeholder={placeholder}
        className={className}
        value={displayText}
        onChange={handleTextChange}
        onBlur={handleBlur}
        style={{
          ...style,
          paddingRight: '2.5rem',
          letterSpacing: '0.03em'
        }}
      />

      <button
        type="button"
        tabIndex={-1}
        onClick={openCalendar}
        title="Open calendar picker"
        style={{
          position: 'absolute',
          right: '0.65rem',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '0.25rem',
          color: 'var(--teal-primary, #0ea5e9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.85,
          transition: 'opacity 0.15s, transform 0.15s'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1.1)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.85'; e.currentTarget.style.transform = 'scale(1)'; }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      </button>

      <input
        type="date"
        ref={nativePickerRef}
        value={currentIso}
        onChange={handleNativePickerChange}
        tabIndex={-1}
        style={{
          position: 'absolute',
          opacity: 0,
          pointerEvents: 'none',
          width: '1px',
          height: '1px',
          right: '1rem',
          bottom: '0'
        }}
      />
    </div>
  );
}
