import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { ArrowLeft, ChevronDown, ChevronUp, Wind } from 'lucide-react';
import { getFeatureDict } from '../i18n/featureTranslations.ts';
import { translateCondition } from '../i18n/translations.ts';
import type {
  LocationResult,
  NormalizedWeatherResponse,
  UILanguageCode,
} from '../types/weather.ts';
import { formatTemp, type TempUnit } from '../utils/weatherFormat.ts';
import {
  buildWeatherObservatory,
  type ObservatoryTelemetry,
  type WeatherScenePreset,
} from './three/weatherObservatory.ts';

interface ThreeWeatherSceneProps {
  weather: NormalizedWeatherResponse | null;
  selectedLocation: LocationResult;
  unit: TempUnit;
  language: UILanguageCode;
  theme: 'light' | 'dark';
  onBack: () => void;
}

type CameraPresetId = 'observatory' | 'anemometer' | 'aerial' | 'horizon';

const CAMERA_PRESETS: Record<
  CameraPresetId,
  { pos: [number, number, number]; target: [number, number, number] }
> = {
  observatory: { pos: [8.8, 5.4, 10.6], target: [0, 3.0, 0] },
  anemometer: { pos: [3.6, 6.6, 4.4], target: [0, 5.7, 0] },
  aerial: { pos: [14.0, 17.5, 16.0], target: [0, 1.5, 0] },
  horizon: { pos: [-11.5, 2.2, 8.2], target: [0, 3.4, 0] },
};

export function ThreeWeatherScene({
  weather,
  selectedLocation,
  unit,
  language,
  theme,
  onBack,
}: ThreeWeatherSceneProps) {
  const fDict = getFeatureDict(language).scene3d;
  const mountRef = useRef<HTMLDivElement>(null);

  const [cameraPreset, setCameraPreset] = useState<CameraPresetId>('observatory');
  const [weatherPreset, setWeatherPreset] = useState<WeatherScenePreset>('live');
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [dockCollapsed, setDockCollapsed] = useState<boolean>(false);

  const telemetry: ObservatoryTelemetry = useMemo(
    () => ({
      temperature_c: weather?.current.temperature_c ?? 28,
      wind_speed_kmh: weather?.current.wind_speed_kmh ?? 14,
      wind_direction_deg: weather?.current.wind_direction_deg ?? 220,
      cloud_cover_percent: weather?.current.cloud_cover_percent ?? 35,
      precipitation_mm: weather?.current.precipitation_mm ?? 0,
      rain_probability_percent: weather?.current.rain_probability_percent ?? 10,
      weather_code: weather?.current.weather_code ?? 1,
      is_day: weather ? weather.current.is_day : theme === 'light',
    }),
    [weather, theme]
  );

  // Store mutable live parameters in refs so React UI updates never recreate WebGLRenderer
  const telemetryRef = useRef<ObservatoryTelemetry>(telemetry);
  const weatherPresetRef = useRef<WeatherScenePreset>(weatherPreset);
  const speedRef = useRef<number>(speedMultiplier);
  const cameraGoalRef = useRef<{
    active: boolean;
    pos: THREE.Vector3;
    target: THREE.Vector3;
  }>({
    active: false,
    pos: new THREE.Vector3(...CAMERA_PRESETS.observatory.pos),
    target: new THREE.Vector3(...CAMERA_PRESETS.observatory.target),
  });

  useEffect(() => {
    telemetryRef.current = telemetry;
  }, [telemetry]);

  useEffect(() => {
    weatherPresetRef.current = weatherPreset;
  }, [weatherPreset]);

  useEffect(() => {
    speedRef.current = speedMultiplier;
  }, [speedMultiplier]);

  const triggerCameraPreset = (id: CameraPresetId) => {
    setCameraPreset(id);
    const p = CAMERA_PRESETS[id];
    cameraGoalRef.current.pos.set(p.pos[0], p.pos[1], p.pos[2]);
    cameraGoalRef.current.target.set(p.target[0], p.target[1], p.target[2]);
    cameraGoalRef.current.active = true;
  };

  // Keyboard shortcut 'H' to toggle collapsible control dock
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }
      if (e.key === 'h' || e.key === 'H') {
        setDockCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Isolated single-mount WebGL lifecycle
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = (() => {
      const probe = document.createElement('canvas');
      const gl = probe.getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(46, width / height, 0.1, 320);
    camera.position.set(...CAMERA_PRESETS.observatory.pos);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmremGenerator.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;
    roomEnv.dispose();
    pmremGenerator.dispose();

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(...CAMERA_PRESETS.observatory.target);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.minDistance = 3.2;
    controls.maxDistance = 46;
    controls.maxPolarAngle = Math.PI * 0.485;
    controls.update();

    // Cancel active camera preset transition if user starts dragging/zooming
    const onControlsStart = () => {
      cameraGoalRef.current.active = false;
    };
    controls.addEventListener('start', onControlsStart);

    const observatory = buildWeatherObservatory(scene, renderer, isSoftwareGl);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    const handleResize = () => {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    let rafId = 0;
    let timeoutId = 0;
    let disposed = false;
    const clock = new THREE.Clock();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (typeof gl.fenceSync === 'function') {
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          if (disposed) return;
          const state = sync ? gl.getSyncParameter(sync, gl.SYNC_STATUS) : gl.SIGNALED;
          if (state === gl.UNSIGNALED) {
            timeoutId = window.setTimeout(poll, 5);
          } else {
            if (sync) gl.deleteSync(sync);
            timeoutId = window.setTimeout(cb, 80);
          }
        };
        timeoutId = window.setTimeout(poll, 5);
      } else {
        timeoutId = window.setTimeout(cb, 80);
      }
    }

    function tick() {
      if (disposed) return;
      const dt = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.elapsedTime;

      if (cameraGoalRef.current.active) {
        const goal = cameraGoalRef.current;
        camera.position.x = THREE.MathUtils.damp(camera.position.x, goal.pos.x, 4.5, dt);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, goal.pos.y, 4.5, dt);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, goal.pos.z, 4.5, dt);
        controls.target.x = THREE.MathUtils.damp(controls.target.x, goal.target.x, 4.5, dt);
        controls.target.y = THREE.MathUtils.damp(controls.target.y, goal.target.y, 4.5, dt);
        controls.target.z = THREE.MathUtils.damp(controls.target.z, goal.target.z, 4.5, dt);
        if (
          camera.position.distanceTo(goal.pos) < 0.04 &&
          controls.target.distanceTo(goal.target) < 0.04
        ) {
          goal.active = false;
        }
      }

      controls.update();
      observatory.update(
        dt,
        elapsed,
        telemetryRef.current,
        weatherPresetRef.current,
        speedRef.current
      );
      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        rafId = window.requestAnimationFrame(tick);
      }
    }

    if (isSoftwareGl) {
      afterDraw(tick);
    } else {
      rafId = window.requestAnimationFrame(tick);
    }

    return () => {
      disposed = true;
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
      controls.removeEventListener('start', onControlsStart);
      controls.dispose();
      observatory.dispose();
      envTarget.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Effective readout values matching active preset
  const displayWindKmh =
    weatherPreset === 'storm'
      ? Math.max(48, telemetry.wind_speed_kmh * 1.4)
      : weatherPreset === 'rain'
      ? Math.max(24, telemetry.wind_speed_kmh)
      : weatherPreset === 'clear'
      ? Math.max(8, telemetry.wind_speed_kmh * 0.6)
      : telemetry.wind_speed_kmh;

  const displayCloudPct =
    weatherPreset === 'storm'
      ? 96
      : weatherPreset === 'rain'
      ? 84
      : weatherPreset === 'clear'
      ? 14
      : weatherPreset === 'night'
      ? 22
      : telemetry.cloud_cover_percent;

  const isDarkHud = theme === 'dark' || weatherPreset === 'storm' || weatherPreset === 'night';
  const hudSurfaceStyle = {
    backgroundColor: isDarkHud ? 'rgba(15, 23, 42, 0.92)' : 'rgba(255, 255, 255, 0.94)',
  };

  return (
    <div className="fixed inset-0 z-40 w-screen h-screen overflow-hidden select-none">
      {/* Isolated WebGL mount container */}
      <div ref={mountRef} className="w-full h-full" />

      {/* Minimal Top-Left Header Bar (zero center occlusion, solid rgba surface) */}
      <div
        style={hudSurfaceStyle}
        className={`fixed top-4 left-4 z-50 rounded-xl border px-4 py-2.5 shadow-lg flex items-center gap-3 max-w-[calc(100vw-2rem)] ${
          isDarkHud
            ? 'border-slate-700 text-slate-100'
            : 'border-slate-200 text-slate-900'
        }`}
      >
        <button
          type="button"
          onClick={onBack}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
            isDarkHud
              ? 'border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700'
              : 'border-slate-200 bg-slate-100 text-slate-800 hover:bg-slate-200'
          }`}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>{fDict.backToDashboard}</span>
        </button>

        <div className="min-w-0">
          <div className="text-sm font-bold leading-tight truncate">{fDict.title}</div>
          <div
            className={`text-[11px] truncate ${
              isDarkHud ? 'text-slate-400' : 'text-slate-600'
            }`}
          >
            {selectedLocation.name}
            {weather
              ? ` · ${formatTemp(weather.current.temperature_c, unit, 1)} · ${translateCondition(
                  weather.current.condition_label,
                  language
                )}`
              : ` · ${fDict.subtitle}`}
          </div>
        </div>
      </div>

      {/* Collapsible Unified Bottom Control Dock */}
      <div
        className="fixed left-1/2 z-50 transition-transform duration-300"
        style={{
          bottom: '20px',
          transform: dockCollapsed
            ? 'translate(-50%, calc(100% + 24px))'
            : 'translate(-50%, 0)',
          maxWidth: 'min(940px, 94vw)',
          width: 'max-content',
        }}
      >
        <button
          type="button"
          onClick={() => setDockCollapsed((c) => !c)}
          style={hudSurfaceStyle}
          className={`mx-auto mb-1.5 flex items-center gap-1.5 rounded-lg border px-3 py-1 text-[11px] font-semibold shadow-md transition-colors whitespace-nowrap ${
            isDarkHud
              ? 'border-slate-700 text-slate-200 hover:bg-slate-800'
              : 'border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          {dockCollapsed ? (
            <>
              <ChevronUp className="h-3.5 w-3.5" />
              <span>{fDict.showControls}</span>
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5" />
              <span>{fDict.hideControls}</span>
            </>
          )}
        </button>

        <div
          style={hudSurfaceStyle}
          className={`rounded-xl border px-4 py-3 shadow-xl space-y-2.5 ${
            isDarkHud
              ? 'border-slate-700 text-slate-100'
              : 'border-slate-200 text-slate-900'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Camera Presets */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className={`text-[11px] font-semibold mr-1 ${
                  isDarkHud ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                {fDict.cameraLabel}
              </span>
              {(
                [
                  ['observatory', fDict.camObservatory],
                  ['anemometer', fDict.camAnemometer],
                  ['aerial', fDict.camAerial],
                  ['horizon', fDict.camHorizon],
                ] as const
              ).map(([camId, label]) => (
                <button
                  key={camId}
                  type="button"
                  onClick={() => triggerCameraPreset(camId)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                    cameraPreset === camId
                      ? 'bg-sky-600 text-white'
                      : isDarkHud
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Atmosphere Presets */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className={`text-[11px] font-semibold mr-1 ${
                  isDarkHud ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                {fDict.weatherLabel}
              </span>
              {(
                [
                  ['live', fDict.presetLive],
                  ['clear', fDict.presetClear],
                  ['rain', fDict.presetRain],
                  ['storm', fDict.presetStorm],
                  ['night', fDict.presetNight],
                ] as const
              ).map(([presetId, label]) => (
                <button
                  key={presetId}
                  type="button"
                  onClick={() => setWeatherPreset(presetId)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                    weatherPreset === presetId
                      ? 'bg-sky-600 text-white'
                      : isDarkHud
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div
            className={`pt-2 border-t flex flex-wrap items-center justify-between gap-4 text-xs ${
              isDarkHud ? 'border-slate-800 text-slate-300' : 'border-slate-200 text-slate-700'
            }`}
          >
            {/* Telemetry Readout */}
            <div className="flex flex-wrap items-center gap-4 font-mono tabular-nums">
              <span>
                {fDict.metricTemp}: <strong>{formatTemp(telemetry.temperature_c, unit, 1)}</strong>
              </span>
              <span className="inline-flex items-center gap-1">
                <Wind className="h-3.5 w-3.5 text-sky-500" />
                {fDict.metricWind}: <strong>{displayWindKmh.toFixed(1)} km/h</strong> ({telemetry.wind_direction_deg}°)
              </span>
              <span>
                {fDict.metricCloud}: <strong>{Math.round(displayCloudPct)}%</strong>
              </span>
              <span>
                {fDict.metricRain}: <strong>{telemetry.precipitation_mm.toFixed(1)} mm</strong>
              </span>
            </div>

            {/* Motion Speed Slider */}
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-[11px] font-medium">
                <span>{fDict.speedLabel}</span>
                <input
                  type="range"
                  min={0.25}
                  max={2.5}
                  step={0.25}
                  value={speedMultiplier}
                  onChange={(e) => setSpeedMultiplier(Number(e.target.value))}
                  className="w-20 accent-sky-600 cursor-pointer"
                />
                <span className="font-mono tabular-nums w-8">{speedMultiplier.toFixed(2)}x</span>
              </label>
              <span
                className={`hidden md:inline text-[11px] ${
                  isDarkHud ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                {fDict.dragHint}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Expand button when collapsed */}
      {dockCollapsed && (
        <button
          type="button"
          onClick={() => setDockCollapsed(false)}
          style={hudSurfaceStyle}
          className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 rounded-lg border px-3.5 py-1.5 text-xs font-semibold shadow-lg transition-colors whitespace-nowrap ${
            isDarkHud
              ? 'border-slate-700 text-slate-100 hover:bg-slate-800'
              : 'border-slate-200 text-slate-800 hover:bg-slate-100'
          }`}
        >
          <ChevronUp className="h-3.5 w-3.5" />
          <span>{fDict.showControls}</span>
        </button>
      )}
    </div>
  );
}
