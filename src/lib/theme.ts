export type ThemePreference = 'system' | 'light' | 'dark';

export const THEME_STORAGE_KEY = 'shoply-theme';
export const THEME_EVENT = 'shoply-theme-change';

export const THEME_OPTIONS: Array<{ value: ThemePreference; label: string }> = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export function readThemePreference(): ThemePreference {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY);
    return v === 'light' || v === 'dark' ? v : 'system';
  } catch {
    return 'system';
  }
}

export function saveThemePreference(value: ThemePreference) {
  try {
    if (value === 'system') localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, value);
  } catch {
    // storage blocked (private mode): the choice still applies for this page view
  }
  window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: value }));
}

/**
 * Runs inline in <head> so the right theme is on <html> before first paint (no white flash for
 * dark users). It also owns live updates: it re-applies when the OS setting changes (only matters
 * for "System") and when the toggle fires THEME_EVENT. Keep it ES5 and dependency-free.
 */
export const THEME_INIT_SCRIPT = `(function(){
var K=${JSON.stringify(THEME_STORAGE_KEY)},E=${JSON.stringify(THEME_EVENT)};
var m=window.matchMedia('(prefers-color-scheme: dark)');
var override=null;
function pref(){if(override)return override;try{var v=localStorage.getItem(K);return v==='light'||v==='dark'?v:'system'}catch(e){return 'system'}}
function apply(){
var p=pref();var dark=p==='dark'||(p==='system'&&m.matches);
document.documentElement.setAttribute('data-theme',dark?'dark':'light');
var c=dark?'#0c0e10':'#f6f6f7';
var metas=document.querySelectorAll('meta[name="theme-color"]');
for(var i=0;i<metas.length;i++){metas[i].setAttribute('content',c);metas[i].removeAttribute('media')}
}
apply();
if(m.addEventListener)m.addEventListener('change',function(){override=null;apply()});
window.addEventListener(E,function(e){override=e&&e.detail||null;apply()});
window.addEventListener('storage',function(e){if(e.key===K){override=null;apply()}});
})();`;
