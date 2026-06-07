import { createContext, useContext } from 'react';
import type { useSpeechToText } from './useSpeechToText';

export type VoiceApi = ReturnType<typeof useSpeechToText>;

export const VoiceContext = createContext<VoiceApi | null>(null);

export function useVoice(): VoiceApi {
  const ctx = useContext(VoiceContext);
  if (!ctx) throw new Error('useVoice must be used within VoiceContext.Provider');
  return ctx;
}
