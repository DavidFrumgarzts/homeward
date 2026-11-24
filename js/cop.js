// Beacon's face in the chat: a small cartoon police officer (Figma "Character/Beacon cop").
// CSS in styles.css makes him bob; adding the class "talking" moves his mouth.
const L = "#14213D", U = "#2B3D66", UL = "#3A5088", S = "#F2C6A0", H = "#2B2118", Y = "#F2B33D";
const o = `stroke="${L}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"`;
const t = `stroke="${L}" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"`;

export function copSvg(talking = false) {
  return `<svg class="cop${talking ? " talking" : ""}" viewBox="0 0 64 72" role="img" aria-label="Beacon">
    <rect x="26.5" y="44" width="11" height="10" fill="${S}"/>
    <path d="M5,72 C5,59 13,53 24,51 L40,51 C51,53 59,59 59,72 Z" fill="${U}" ${o}/><path d="M32,59 V72" fill="none" ${t}/>
    <path d="M25,50 L32,59 L26.5,63 L21,53 Z" fill="${UL}" ${t}/><path d="M39,50 L32,59 L37.5,63 L43,53 Z" fill="${UL}" ${t}/>
    <rect x="12.5" y="63" width="9.5" height="7.5" rx="1" fill="none" ${t}/>
    <path d="M45,60.5 L49,62 V65 C49,67.4 47.2,68.8 45,69.5 C42.8,68.8 41,67.4 41,65 V62 Z" fill="${Y}" ${t}/>
    <circle cx="18.6" cy="34" r="3.2" fill="${S}" ${t}/><circle cx="45.4" cy="34" r="3.2" fill="${S}" ${t}/>
    <path d="M19,26 C19,41 24,49 32,49 C40,49 45,41 45,26 Z" fill="${S}" ${o}/>
    <rect x="19.8" y="26" width="2.6" height="6.5" fill="${H}"/><rect x="41.6" y="26" width="2.6" height="6.5" fill="${H}"/>
    <path d="M13,22.5 C10.5,10 23,5 32,5 C41,5 53.5,10 51,22.5 C44,19.5 20,19.5 13,22.5 Z" fill="${U}" ${o}/>
    <path d="M16.5,22 C22,19.6 42,19.6 47.5,22 V27 H16.5 Z" fill="${UL}" ${t}/>
    <path d="M16.5,27 C21,31.5 43,31.5 47.5,27 C42,25.6 22,25.6 16.5,27 Z" fill="${L}" ${t}/>
    <path d="M32,9 L35.4,10.4 V13.2 C35.4,15.2 33.9,16.5 32,17.2 C30.1,16.5 28.6,15.2 28.6,13.2 V10.4 Z" fill="${Y}" ${t}/>
    <path d="M23.8,33.2 L28.8,32.6 M35.2,32.6 L40.2,33.2" fill="none" stroke="${L}" stroke-width="1.7" stroke-linecap="round"/>
    <circle cx="26.6" cy="36.2" r="1.7" fill="${L}"/><circle cx="37.4" cy="36.2" r="1.7" fill="${L}"/>
    <path d="M32.2,37 Q34,40 31.4,40.6" fill="none" stroke="${L}" stroke-width="1.4" stroke-linecap="round"/>
    <path class="mouth-smile" d="M27.6,42.6 Q32,46.4 36.4,42.6" fill="none" stroke="${L}" stroke-width="1.7" stroke-linecap="round"/>
    <ellipse class="mouth-open" cx="32" cy="43.6" rx="3" ry="2.6" fill="${L}"/>
  </svg>`;
}
