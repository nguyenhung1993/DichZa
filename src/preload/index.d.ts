// ============================================================
// HotLingo — Preload Type Declaration
// Cho renderer biết window.hotlingo có những API gì
// ============================================================

import type { HotLingoAPI } from './index'

declare global {
  interface Window {
    hotlingo: HotLingoAPI
  }
}
