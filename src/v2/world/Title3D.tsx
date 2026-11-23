import { Center, Text3D } from '@react-three/drei';
import { FONT_3D } from './fonts';
import { C } from '../palette';

/** section titles are part of the world: rounded, bevelled clay letters (plan §1) */
export function Title3D({ text, size = 1.6, ...props }: { text: string; size?: number } & JSX.IntrinsicElements['group']) {
  return (
    <group {...props}>
      <Center disableY>
        <Text3D font={FONT_3D} size={size} height={size * 0.38} curveSegments={8}
          bevelEnabled bevelSize={size * 0.06} bevelThickness={size * 0.08} bevelSegments={5} castShadow receiveShadow>
          {text}
          <meshStandardMaterial color={C.clayLight} roughness={0.75} />
        </Text3D>
      </Center>
    </group>
  );
}
