import { create } from 'zustand'

/** Overlay state: contact modal, mobile menu, project grid/list view. */
type UIState = {
  contactOpen: boolean
  mobileMenuOpen: boolean
  projectView: 'grid' | 'list'
  openContact: () => void
  closeContact: () => void
  setMobileMenu: (open: boolean) => void
  toggleProjectView: () => void
}

export const useUIStore = create<UIState>((set) => ({
  contactOpen: false,
  mobileMenuOpen: false,
  projectView: 'grid',
  openContact: () => set({ contactOpen: true, mobileMenuOpen: false }),
  closeContact: () => set({ contactOpen: false }),
  setMobileMenu: (mobileMenuOpen) => set({ mobileMenuOpen }),
  toggleProjectView: () =>
    set((s) => ({ projectView: s.projectView === 'grid' ? 'list' : 'grid' })),
}))
