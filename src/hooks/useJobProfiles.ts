import { useState, useEffect } from 'react';
import { JobProfile, JobProfileAspect } from '../types';

const PROFILES_KEY = 'papi_job_profiles';

export function useJobProfiles() {
  const [profiles, setProfiles] = useState<JobProfile[]>([]);

  // Load profiles from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(PROFILES_KEY);
    if (stored) {
      try {
        setProfiles(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to parse job profiles from localStorage', error);
      }
    }
  }, []);

  const saveProfile = (
    positionName: string,
    roleSummary: string,
    papiAspects: JobProfileAspect[],
    codesString: string
  ): JobProfile => {
    const newProfile: JobProfile = {
      id: crypto.randomUUID(),
      positionName,
      roleSummary,
      papiAspects,
      codesString,
      createdAt: Date.now(),
    };

    setProfiles((prev) => {
      const updated = [newProfile, ...prev].slice(0, 30); // max 30 profiles
      localStorage.setItem(PROFILES_KEY, JSON.stringify(updated));
      return updated;
    });

    return newProfile;
  };

  const deleteProfile = (id: string) => {
    setProfiles((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      localStorage.setItem(PROFILES_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const clearProfiles = () => {
    setProfiles([]);
    localStorage.removeItem(PROFILES_KEY);
  };

  return {
    profiles,
    saveProfile,
    deleteProfile,
    clearProfiles,
  };
}
