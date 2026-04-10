"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { CountryCode, CurrencyCode, UserProfile } from "@/lib/models";
import { useAuth } from "@/lib/auth/auth-context";
import { createClient } from "@/lib/supabase/client";

// ─── Country config ──────────────────────────────────────────────────────────

export type CountryConfig = {
  code: CountryCode;
  flag: string;
  name: string;
  currencyCode: CurrencyCode;
};

export const COUNTRY_CONFIGS: CountryConfig[] = [
  { code: "CL", flag: "🇨🇱", name: "Chile", currencyCode: "CLP" },
  { code: "EC", flag: "🇪🇨", name: "Ecuador", currencyCode: "USD" },
];

const ACTIVE_COUNTRY_KEY = "cgapp_active_country";
const DEFAULT_COUNTRY: CountryCode = "CL";

// ─── Context ─────────────────────────────────────────────────────────────────

type ProfileContextValue = {
  profiles: UserProfile[];
  activeProfile: UserProfile | null;
  activeCountry: CountryCode;
  setActiveCountry: (code: CountryCode) => void;
  isLoadingProfiles: boolean;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

// ─── DB helpers ──────────────────────────────────────────────────────────────

type DbProfile = {
  id: string;
  user_id: string;
  country_code: string;
  currency_code: string;
  created_at: string;
};

function dbToProfile(row: DbProfile): UserProfile {
  return {
    id: row.id,
    userId: row.user_id,
    countryCode: row.country_code as CountryCode,
    currencyCode: row.currency_code as CurrencyCode,
    createdAt: row.created_at,
  };
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function ProfileProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const { user } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(true);
  const [activeCountry, setActiveCountryState] = useState<CountryCode>(() => {
    if (typeof window === "undefined") return DEFAULT_COUNTRY;
    const stored = localStorage.getItem(ACTIVE_COUNTRY_KEY);
    return stored === "CL" || stored === "EC" ? stored : DEFAULT_COUNTRY;
  });

  useEffect(() => {
    void (async () => {
      if (!user) {
        setProfiles([]);
        setIsLoadingProfiles(false);
        return;
      }

      setIsLoadingProfiles(true);

      const { data: existing } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id);

      let current = ((existing ?? []) as DbProfile[]).map(dbToProfile);

      // Ensure CL profile always exists
      const hasCL = current.some((p) => p.countryCode === "CL");
      if (!hasCL) {
        const { data: created } = await supabase
          .from("profiles")
          .insert({ user_id: user.id, country_code: "CL", currency_code: "CLP" })
          .select()
          .single();
        if (created) current = [...current, dbToProfile(created as DbProfile)];
      }

      setProfiles(current);
      setIsLoadingProfiles(false);
    })();
  }, [user, supabase]);

  const setActiveCountry = useCallback(
    async (code: CountryCode) => {
      if (typeof window !== "undefined") {
        localStorage.setItem(ACTIVE_COUNTRY_KEY, code);
      }
      setActiveCountryState(code);

      // Create profile for this country if it doesn't exist yet
      if (user && !profiles.some((p) => p.countryCode === code)) {
        const config = COUNTRY_CONFIGS.find((c) => c.code === code);
        if (config) {
          const { data: created } = await supabase
            .from("profiles")
            .insert({ user_id: user.id, country_code: code, currency_code: config.currencyCode })
            .select()
            .single();
          if (created) {
            setProfiles((prev) => [...prev, dbToProfile(created as DbProfile)]);
          }
        }
      }
    },
    [user, profiles, supabase],
  );

  const activeProfile = useMemo(
    () => profiles.find((p) => p.countryCode === activeCountry) ?? null,
    [profiles, activeCountry],
  );

  const value = useMemo<ProfileContextValue>(
    () => ({ profiles, activeProfile, activeCountry, setActiveCountry, isLoadingProfiles }),
    [profiles, activeProfile, activeCountry, setActiveCountry, isLoadingProfiles],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used within ProfileProvider");
  }
  return context;
}
