import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, Pattern, Rect } from 'react-native-svg';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

// The app's page. An opaque parchment fill with a tactile paper grain baked into it,
// dropped in behind a screen's content so text and cards sit *on* the paper rather
// than under a speckle overlay. Rendered as a single repeating SVG <Pattern> tile —
// defined once and tiled by the renderer, so it's cheap and pixel-identical on iOS,
// Android, and web (no CSS noise / feTurbulence needed).

const TILE = 128;
const SPECK_COUNT = 170;

/** Tiny deterministic PRNG so the grain is stable across renders and platforms. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Speck {
  x: number;
  y: number;
  size: number;
  /** Relative weight 0..1; scaled by the theme strength for final opacity. */
  weight: number;
  /** Light fibers vs. dark flecks — a page has both. */
  fiber: boolean;
}

const SPECKS: Speck[] = (() => {
  const rand = mulberry32(0x9e3779b9);
  const list: Speck[] = [];
  for (let i = 0; i < SPECK_COUNT; i += 1) {
    list.push({
      x: rand() * TILE,
      y: rand() * TILE,
      size: 0.55 + rand() * 1.55,
      weight: 0.32 + rand() * 0.68,
      fiber: rand() > 0.6,
    });
  }
  return list;
})();

export function PaperBackground({ style }: { style?: StyleProp<ViewStyle> }) {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';

  const base = dark ? Colors.dark.background : Colors.light.background;
  // Dark flecks are the ink of the pulp; fibers are the lighter threads catching light.
  const fleck = dark ? '#000000' : '#3A2E1F';
  const fiber = dark ? '#F3ECD9' : '#FFFFFF';
  // How hard the grain bites — present, but not busy.
  const strength = dark ? 0.2 : 0.16;

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern id="paper-grain" patternUnits="userSpaceOnUse" width={TILE} height={TILE}>
            {SPECKS.map((sp, i) => (
              <Rect
                key={i}
                x={sp.x}
                y={sp.y}
                width={sp.size}
                height={sp.size}
                fill={sp.fiber ? fiber : fleck}
                opacity={sp.weight * strength}
              />
            ))}
          </Pattern>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={base} />
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#paper-grain)" />
      </Svg>
    </View>
  );
}
