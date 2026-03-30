import { create } from "zustand";

interface OnboardingState {
  step: number;
  companyName: string;
  companyEmail: string;
  gstNumber: string;
  logoUrl: string;
  branches: Array<{
    name: string;
    address: string;
    city: string;
    pincode: string;
    contactPerson: string;
    contactPhone: string;
    deliveryWindow: "MORNING" | "AFTERNOON";
  }>;
  setStep: (step: number) => void;
  setCompanyData: (data: Partial<OnboardingState>) => void;
  addBranch: (branch: OnboardingState["branches"][0]) => void;
  removeBranch: (index: number) => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  step: 1,
  companyName: "",
  companyEmail: "",
  gstNumber: "",
  logoUrl: "",
  branches: [],
  setStep: (step) => set({ step }),
  setCompanyData: (data) => set(data),
  addBranch: (branch) =>
    set((state) => ({ branches: [...state.branches, branch] })),
  removeBranch: (index) =>
    set((state) => ({
      branches: state.branches.filter((_, i) => i !== index),
    })),
  reset: () =>
    set({
      step: 1,
      companyName: "",
      companyEmail: "",
      gstNumber: "",
      logoUrl: "",
      branches: [],
    }),
}));

interface AppState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));
