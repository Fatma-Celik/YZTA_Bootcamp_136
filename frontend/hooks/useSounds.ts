// hooks/useSounds.ts
import { useAudioPlayer } from 'expo-audio';

export function useSounds() {
  const tapPlayer = useAudioPlayer(require('@/assets/sounds/tap.wav'));
  const successPlayer = useAudioPlayer(require('@/assets/sounds/success.wav'));

  const playTap = () => {
    tapPlayer.seekTo(0);
    tapPlayer.play();
  };

  const playSuccess = () => {
    successPlayer.seekTo(0);
    successPlayer.play();
  };

  return { playTap, playSuccess };
}