export interface LocationState {
  city: string | null;
  isLoading: boolean;
}

export interface LocationContextType extends LocationState {
  setCity: (city: string | null) => Promise<void>;
  detectLocation: () => Promise<void>;
}
