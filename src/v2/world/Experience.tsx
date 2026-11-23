import * as THREE from 'three';
import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import { EffectComposer, N8AO, Bloom, Vignette, ToneMapping } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import { Sky } from './Sky';
import { Ground } from './Ground';
import { School } from './props/School';
import { Trees } from './props/Trees';
import { Lamps } from './props/Lamps';
import { C } from '../palette';

/** One low, pink key light from the horizon; its shadow box follows the camera so shadows stay crisp everywhere. */
function KeyLight() {
  const light = useRef<THREE.DirectionalLight>(null!);
  const { camera } = useThree();
  const offset = new THREE.Vector3(34, 12, -14);
  useFrame(() => {
    const l = light.current;
    const c = camera.position;
    l.position.set(c.x + offset.x, offset.y, c.z - 10 + offset.z);
    l.target.position.set(c.x, 0, c.z - 10);
    l.target.updateMatrixWorld();
  });
  return (
    <directionalLight ref={light} color="#FFE1EC" intensity={3.4} castShadow
      shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004} shadow-normalBias={0.04}
      shadow-camera-left={-45} shadow-camera-right={45} shadow-camera-top={45} shadow-camera-bottom={-45}
      shadow-camera-near={1} shadow-camera-far={140} shadow-radius={6} />
  );
}

export function Experience({ quality = 'high' as 'high' | 'low' }) {
  return (
    <>
      <color attach="background" args={[C.horizon]} />
      <fog attach="fog" args={[C.horizon, 20, 90]} />
      <Sky />
      <hemisphereLight args={[C.sky, C.shade, 0.55]} />
      <KeyLight />
      <Environment resolution={64}>
        <Lightformer form="rect" intensity={0.7} color={C.horizon} position={[0, 2, -10]} scale={[20, 4, 1]} />
        <Lightformer form="rect" intensity={0.5} color={C.sky} position={[0, 10, 0]} rotation-x={Math.PI / 2} scale={[20, 20, 1]} />
      </Environment>

      <Ground />
      <School position={[-22, 0, -12]} rotation-y={0.95} />
      <Trees skip={[[0.0, 0.16]]} />
      <Lamps />

      {quality === 'high' ? (
        <EffectComposer multisampling={0} enableNormalPass={false}>
          <N8AO aoRadius={2.2} intensity={2.4} distanceFalloff={1} halfRes color={C.shade} />
          <Bloom luminanceThreshold={0.95} intensity={0.55} mipmapBlur />
          <Vignette offset={0.25} darkness={0.45} />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        </EffectComposer>
      ) : (
        <EffectComposer multisampling={0} enableNormalPass={false}>
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        </EffectComposer>
      )}
    </>
  );
}
