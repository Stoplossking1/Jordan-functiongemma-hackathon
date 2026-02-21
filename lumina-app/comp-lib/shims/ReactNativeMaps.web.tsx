import * as React from 'react';
import {
  type AnimatedRegionTimingResult,
  type CalloutProps,
  type CalloutSubviewProps,
  type CircleProps,
  type Ctx,
  type GeojsonProps,
  type HeatmapProps,
  type LatLng,
  type MapViewImperative,
  type MapViewProps,
  type MarkerProps,
  type OverlayProps,
  type PolygonProps,
  type PolylineProps,
  type URLTileProps,
  type WMSTileProps,
  useCircle,
  useMapView,
  useMarker,
  usePolygon,
  usePolyline,
} from './ReactNativeMapsFunc.web';

const MapCtx = React.createContext<Ctx | null>(null);

// ----- AnimatedRegion: minimal behavior
export class AnimatedRegion {
  private value: LatLng;
  private id = 0;
  private ls = new Map<number, (v: LatLng) => void>();
  constructor(v: LatLng) {
    this.value = v;
  }
  setValue(v: LatLng) {
    this.value = v;
    this.emit();
  }
  timing(cfg: { toValue: LatLng; duration?: number }): AnimatedRegionTimingResult {
    return {
      start: (cb?: (r: { finished: boolean }) => void) => {
        this.setValue(cfg.toValue);
        cb?.({ finished: true });
      },
    };
  }
  stopAnimation() {
    // no-op
  }
  addListener(fn: (v: LatLng) => void): string {
    const id = ++this.id;
    this.ls.set(id, fn);
    return String(id);
  }
  removeListener(id: string) {
    this.ls.delete(Number(id));
  }
  private emit() {
    for (const f of Array.from(this.ls.values())) f(this.value);
  }
  __getValue(): LatLng {
    return this.value;
  }
}

const MapView = React.forwardRef<MapViewImperative, MapViewProps>(function MapView(
  { style, children, ...props },
  ref,
): React.JSX.Element {
  const { containerRef, region, size, toXY, handleClick, getImperativeHandle } = useMapView(props);

  React.useImperativeHandle(ref, getImperativeHandle, [getImperativeHandle]);

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      style={{
        position: 'relative',
        width: '100%',
        height: 320,
        background: 'repeating-linear-gradient(45deg,#f7f7f7,#f7f7f7 12px,#efefef 12px,#efefef 24px)',
        border: '1px dashed #c7c7c7',
        borderRadius: 8,
        overflow: 'hidden',
        boxSizing: 'border-box',
        ...(style as object),
      }}
      role="img"
      aria-label="Map (web shim)"
    >
      {/* simple SVG overlay for shapes */}
      <MapCtx.Provider value={{ region, size, toXY }}>
        <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {/* Shapes render here via portals */}
        </svg>
        {children}
      </MapCtx.Provider>
      <div
        style={{
          position: 'absolute',
          bottom: 10,
          left: 0,
          right: 0,
          padding: 12,
          textAlign: 'center',
          alignSelf: 'center',
          font: '14px system-ui',
          color: '#333',
        }}
      >
        <strong>Please use mobile preview on your phone to load maps.</strong>
      </div>
    </div>
  );
});

export default MapView;

// ----- children components

export function Marker({ coordinate, children, ...props }: MarkerProps): React.ReactNode {
  const ctx = React.useContext(MapCtx);
  const { handleClick } = useMarker({ coordinate, ...props });

  if (!ctx?.size.w || !ctx.size.h) return null;
  const { x, y } = ctx.toXY(coordinate);
  return (
    <div
      onClick={handleClick}
      style={{
        position: 'absolute',
        left: x - 6,
        top: y - 6,
        width: 12,
        height: 12,
        borderRadius: 12,
        background: '#222',
        cursor: 'pointer',
      }}
      title={`${coordinate.latitude},${coordinate.longitude}`}
    >
      {children ? (
        <div style={{ position: 'absolute', transform: 'translate(-50%, -100%)', left: 6, top: -6 }}>{children}</div>
      ) : null}
    </div>
  );
}

export function Callout({ children }: CalloutProps): React.ReactNode {
  return (
    <div
      style={{
        position: 'absolute',
        transform: 'translate(-50%, -120%)',
        left: 6,
        top: -6,
        background: 'white',
        border: '1px solid #ccc',
        borderRadius: 6,
        padding: '6px 8px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
        font: '12px system-ui',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </div>
  );
}

export function Polyline({ coordinates, strokeWidth = 2, strokeColor = '#333' }: PolylineProps): React.ReactNode {
  const ctx = React.useContext(MapCtx);
  const { pathData } = usePolyline({ coordinates, strokeWidth, strokeColor }, ctx);

  if (!ctx?.size.w || !ctx.size.h || coordinates.length < 2) return null;
  return (
    <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <polyline fill="none" stroke={strokeColor} strokeWidth={strokeWidth} points={pathData} />
    </svg>
  );
}

export function Polygon({
  coordinates,
  strokeWidth = 2,
  strokeColor = '#333',
  fillColor = 'rgba(0,0,0,0.08)',
}: PolygonProps): React.ReactNode {
  const ctx = React.useContext(MapCtx);
  const { pathData } = usePolygon({ coordinates, strokeWidth, strokeColor, fillColor }, ctx);

  if (!ctx?.size.w || !ctx.size.h || coordinates.length < 3) return null;
  return (
    <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <polygon fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} points={pathData} />
    </svg>
  );
}

export function Circle({
  center,
  radius,
  strokeWidth = 2,
  strokeColor = '#333',
  fillColor = 'rgba(0,0,0,0.08)',
}: CircleProps): React.ReactNode {
  const ctx = React.useContext(MapCtx);
  const { centerXY, radiusX, radiusY } = useCircle({ center, radius, strokeWidth, strokeColor, fillColor }, ctx);

  if (!ctx?.size.w || !ctx.size.h || radius <= 0) return null;

  return (
    <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <ellipse
        cx={centerXY.x}
        cy={centerXY.y}
        rx={radiusX}
        ry={radiusY}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
      />
    </svg>
  );
}

// ----- Additional stub components (not implemented for web)

export function Geojson(_props: GeojsonProps): React.ReactNode {
  return null; // Web shim: not implemented
}

export function Heatmap(_props: HeatmapProps): React.ReactNode {
  return null; // Web shim: not implemented
}

export function Overlay(_props: OverlayProps): React.ReactNode {
  return null; // Web shim: not implemented
}

export function URLTile(_props: URLTileProps): React.ReactNode {
  return null; // Web shim: not implemented
}

export function WMSTile(_props: WMSTileProps): React.ReactNode {
  return null; // Web shim: not implemented
}

export function CalloutSubview(_props: CalloutSubviewProps): React.ReactNode {
  return null; // Web shim: not implemented (iOS only)
}
