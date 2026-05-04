export const GENERAL_SVGS = {
  Reading: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="6" r="2.5" stroke="currentColor" stroke-width="2"/>
    <path d="M8 13C8 13 10 11 12 11C14 11 16 13 16 13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <path d="M7 21V16C7 14.3431 8.34315 13 10 13H14C15.6569 13 17 14.3431 17 16V21" stroke="currentColor" stroke-width="2"/>
    <path d="M9 17H15V21H9V17Z" fill="currentColor" fill-opacity="0.2" stroke="currentColor" stroke-width="1.5"/>
  </svg>`,

  Meditating: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="5" r="2.5" stroke="currentColor" stroke-width="2"/>
    <path d="M12 7.5V13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <path d="M7 14C7 14 9 12 12 12C15 12 17 14 17 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <path d="M12 13L17 18L21 16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M12 13L7 18L3 16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  Working: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="6" r="2" stroke="currentColor" stroke-width="2"/>
    <path d="M8 12L12 10L16 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M12 10V15" stroke="currentColor" stroke-width="2"/>
    <path d="M7 21H17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <rect x="6" y="16" width="12" height="4" rx="1" fill="currentColor" fill-opacity="0.2" stroke="currentColor" stroke-width="1.5"/>
  </svg>`,

  Praying: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="6" r="2" stroke="currentColor" stroke-width="2"/>
    <path d="M12 8V14L16 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M12 14L8 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M9 20H15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  </svg>`,

  Shield: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="6" r="2" stroke="currentColor" stroke-width="2"/>
    <path d="M12 8V14" stroke="currentColor" stroke-width="2"/>
    <path d="M8 12H16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <path d="M12 14L15 21H9L12 14Z" fill="currentColor" fill-opacity="0.2" stroke="currentColor" stroke-width="1.5"/>
    <path d="M17 11C17 11 19 11 20 12C21 13 21 15 20 16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`,

  BookHeading: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <!-- Book Cover -->
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" fill="currentColor" fill-opacity="0.1"/>
      <!-- Bookmark (The "Different Color" part) -->
      <path d="M14 2v8l2.5-2.5L19 10V2h-5z" fill="currentColor" fill-opacity="0.3" stroke="currentColor" stroke-width="1"/>
      <!-- Spine Detail -->
      <path d="M6.5 17c-1 0-1.5 0.5-2 1" />
    </g>
  </svg>`,

  Skincare: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <!-- Badan Botol Serum -->
      <path d="M7 10h10v9a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-9z" />
      <!-- Tutup Botol & Pipet -->
      <path d="M10 10V7h4v3M12 7V4h-2M14 4h-4" />
      <!-- Tetesan Serum -->
      <path d="M12 14c1 1 1 3 0 3s-1-2 0-3z" fill="currentColor" stroke="none"/>
      <!-- Aksen Kilau/Sparkle -->
      <path d="M19 4l1 1M21 7l-1 1M4 6l1-1" stroke-width="1.5" opacity="0.6"/>
    </g>
  </svg>`,

  Language: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <!-- Kepala & Badan (Stickman Style) -->
      <circle cx="9" cy="8" r="3" />
      <path d="M9 11v4M6 21l3-6 3 6" />
      <!-- Speech Bubble -->
      <path d="M16 4h4a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-1l-2 3v-3h-1a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" fill="currentColor" stroke="none" opacity="0.9"/>
      <!-- Huruf 'A' inside bubble -->
      <path d="M17 9l1-3 1 3M16.5 8h2" stroke="#fff" stroke-width="1.2"/>
    </g>
  </svg>`,

  Cleaning: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <!-- Handle Sapu -->
      <path d="M19 5L11 13" stroke-width="2.5" />
      <!-- Kepala Sapu -->
      <path d="M12 12L7 17C6 18 5 20 5 21H13C13 20 12 18 11 17L12 12Z" fill="currentColor" fill-opacity="0.2"/>
      <!-- Bulu Sapu -->
      <path d="M7 17L6 20M9 15L8 19M11 13L10 18" opacity="0.6"/>
      
      <!-- Sampah Berserakan -->
      <circle cx="16" cy="18" r="1" fill="currentColor" stroke="none" />
      <path d="M18 15l1 1M4 14l1-1" stroke-width="1.5" opacity="0.4"/>
      <circle cx="15" cy="12" r="0.5" fill="currentColor" stroke="none" opacity="0.5"/>
      
      <!-- Aksen Kilau (Hasil Bersih) -->
      <path d="M20 10l1 1M22 8l-1 1" stroke-width="1.5" opacity="0.8" />
    </g>
  </svg>`,

  NoSmoking: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <!-- Rokok -->
      <rect x="4" y="11" width="12" height="3" rx="0.5" />
      <path d="M16 11h2v3h-2v-3z" fill="currentColor" fill-opacity="0.3" stroke="none" />
      <!-- Asap -->
      <path d="M18 7c0.5-1 1.5-1 2 0s1.5 1 2 0" opacity="0.4" />
      <!-- Forbidden Slash -->
      <circle cx="12" cy="12" r="9" stroke-width="2.5" />
      <path d="M5.6 18.4L18.4 5.6" stroke-width="2.5" />
    </g>
  </svg>`,

  NoJunkFood: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <!-- Burger Shape -->
      <path d="M6 14h12M6 14a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3M6 14v1a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-1" fill="currentColor" fill-opacity="0.1" />
      <path d="M7 11.5c.5-.5 1.5-.5 2 0M15 11.5c.5-.5 1.5-.5 2 0" opacity="0.6" />
      <!-- Forbidden Slash -->
      <circle cx="12" cy="12" r="9" stroke-width="2.5" />
      <path d="M5.6 18.4L18.4 5.6" stroke-width="2.5" />
    </g>
  </svg>`,

  WaterGlass: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <!-- Glass Outline -->
      <path d="M6 3h12l-1.5 17a2 2 0 0 1-2 2h-5a2 2 0 0 1-2-2L6 3z" />
      <!-- Water Level -->
      <path d="M7 12h10" opacity="0.6" />
      <path d="M7.5 17h9" opacity="0.6" />
      <!-- Water Content (Bottom Fill) -->
      <path d="M7.1 12l.7 8a1 1 0 0 0 1 1h6.4a1 1 0 0 0 1-1l.7-8H7.1z" fill="currentColor" fill-opacity="0.2" stroke="none" />
      <!-- Reflection/Sparkle -->
      <path d="M15 6l.5 2" stroke-width="1.5" opacity="0.4" />
    </g>
  </svg>`,
};
