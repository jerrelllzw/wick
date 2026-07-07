import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { useWick, WickProvider } from '@/state/AppStateProvider';
import { Onboarding } from '@/ui/Onboarding';
import { UnlockBanner } from '@/ui/UnlockBanner';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <WickProvider>
          <AnimatedSplashOverlay />
          <AppTabs />
          <OnboardingGate />
          <UnlockBanner />
        </WickProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

/** Full-screen onboarding overlay, shown until the user finishes it. */
function OnboardingGate() {
  const { ready, settings } = useWick();
  if (!ready || settings.onboardingComplete) return null;
  return <Onboarding />;
}
