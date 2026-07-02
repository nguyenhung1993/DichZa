// ============================================================
// DichZa — Preload Type Declaration
// Cho renderer biết window.dichza có những API gì
// ============================================================

import type { DichZaAPI } from './index'

declare global {
  interface Window {
    dichza: DichZaAPI
  }
}
