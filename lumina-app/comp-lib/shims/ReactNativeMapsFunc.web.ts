// ----- Business Logic Hooks -----

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

export type LatLng = { latitude: number; longitude: number };
export type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

export const PROVIDER_DEFAULT = 'provider.default';
export const PROVIDER_GOOGLE = 'provider.google';
export const PROVIDER_APPLE = 'provider.apple';

// ----- math: naive equirectangular projection around the current region
export function project(
  lat: number,
  lon: number,
  r: Region,
  w: number,
  h: number,
): {
  x: number;
  y: number;
} {
  const fx = (lon - r.longitude) / r.longitudeDelta + 0.5; // 0..1
  const fy = 0.5 - (lat - r.latitude) / r.latitudeDelta; // 0..1 (invert Y)
  return { x: fx * w, y: fy * h };
}

export function unproject(x: number, y: number, r: Region, w: number, h: number): LatLng {
  const lon = (x / w - 0.5) * r.longitudeDelta + r.longitude;
  const lat = (0.5 - y / h) * r.latitudeDelta + r.latitude;
  return { latitude: lat, longitude: lon };
}

export type MapEvent<T = {}> = { nativeEvent: T & { coordinate?: LatLng; position?: { x: number; y: number } } };

export type Camera = {
  center: { latitude: number; longitude: number };
  pitch?: number;
  heading?: number;
  altitude?: number;
  zoom?: number;
};

export type EdgePadding = { top: number; right: number; bottom: number; left: number };
export type EdgeInsets = { top: number; left: number; bottom: number; right: number };
export type Point = { x: number; y: number };
export type CameraZoomRange = {
  minCenterCoordinateDistance?: number;
  maxCenterCoordinateDistance?: number;
  animated?: boolean;
};

export type MapViewProps = {
  style?: React.CSSProperties | any;
  provider?: string;
  initialRegion?: Region;
  region?: Region;
  camera?: Camera;
  initialCamera?: Camera;
  mapPadding?: EdgePadding;
  paddingAdjustmentBehavior?: 'always' | 'automatic' | 'never';
  liteMode?: boolean;
  googleMapId?: string;
  mapType?:
    | 'standard'
    | 'none'
    | 'satellite'
    | 'hybrid'
    | 'terrain'
    | 'mutedStandard'
    | 'satelliteFlyover'
    | 'hybridFlyover';
  customMapStyle?: any[];
  userInterfaceStyle?: 'light' | 'dark';
  showsUserLocation?: boolean;
  userLocationPriority?: 'balanced' | 'high' | 'low' | 'passive';
  userLocationUpdateInterval?: number;
  userLocationFastestInterval?: number;
  userLocationAnnotationTitle?: string;
  followsUserLocation?: boolean;
  userLocationCalloutEnabled?: boolean;
  showsMyLocationButton?: boolean;
  showsPointsOfInterests?: boolean;
  pointsOfInterestFilter?: string[];
  showsCompass?: boolean;
  showsScale?: boolean;
  showsBuildings?: boolean;
  showsTraffic?: boolean;
  showsIndoors?: boolean;
  showsIndoorLevelPicker?: boolean;
  zoomEnabled?: boolean;
  zoomTapEnabled?: boolean;
  zoomControlEnabled?: boolean;
  minZoomLevel?: number;
  maxZoomLevel?: number;
  rotateEnabled?: boolean;
  scrollEnabled?: boolean;
  scrollDuringRotateOrZoomEnabled?: boolean;
  pitchEnabled?: boolean;
  toolbarEnabled?: boolean;
  cacheEnabled?: boolean;
  loadingEnabled?: boolean;
  loadingIndicatorColor?: string;
  loadingBackgroundColor?: string;
  tintColor?: string;
  moveOnMarkerPress?: boolean;
  legalLabelInsets?: EdgeInsets;
  kmlSrc?: string;
  compassOffset?: Point;
  isAccessibilityElement?: boolean;
  cameraZoomRange?: CameraZoomRange;
  onPress?: (e: MapEvent) => void;
  onRegionChange?: (r: Region) => void;
  onRegionChangeComplete?: (r: Region) => void;
  onMapReady?: () => void;
  onKmlReady?: (e: any) => void;
  onRegionChangeStart?: (r: Region, details?: { isGesture: boolean }) => void;
  onUserLocationChange?: (e: { nativeEvent: { coordinate: LatLng } }) => void;
  onDoublePress?: (e: MapEvent) => void;
  onPanDrag?: (e: MapEvent) => void;
  onPoiClick?: (e: MapEvent<{ placeId: string; name: string }>) => void;
  onLongPress?: (e: MapEvent) => void;
  onMarkerPress?: (e: any) => void;
  onMarkerSelect?: (e: any) => void;
  onMarkerDeselect?: (e: any) => void;
  onCalloutPress?: (e: any) => void;
  onMarkerDragStart?: (e: MapEvent) => void;
  onMarkerDrag?: (e: MapEvent) => void;
  onMarkerDragEnd?: (e: MapEvent) => void;
  onIndoorLevelActivated?: (e: any) => void;
  onIndoorBuildingFocused?: (e: any) => void;
  children?: React.ReactNode;
};

export type MapViewImperative = {
  animateToRegion: (r: Region, ms?: number) => void;
  setCamera?: (c: any) => void;
  animateCamera?: (c: any, opts?: { duration?: number }) => void;
  fitToCoordinates?: (coords: LatLng[], opts?: { edgePadding?: any; animated?: boolean }) => void;
  getCamera?: () => Promise<any>;
};

export type Ctx = {
  region: Region;
  size: { w: number; h: number };
  toXY: (c: LatLng) => { x: number; y: number };
};

export interface AnimatedRegionTimingResult {
  start: (cb?: (r: { finished: boolean }) => void) => void;
}

export type MarkerProps = {
  coordinate: LatLng;
  title?: string;
  description?: string;
  image?: any;
  icon?: any;
  pinColor?: string;
  centerOffset?: Point;
  calloutOffset?: Point;
  anchor?: Point;
  calloutAnchor?: Point;
  flat?: boolean;
  identifier?: string;
  rotation?: number;
  draggable?: boolean;
  tappable?: boolean;
  tracksViewChanges?: boolean;
  tracksInfoWindowChanges?: boolean;
  stopPropagation?: boolean;
  opacity?: number;
  isPreselected?: boolean;
  key?: string;
  titleVisibility?: 'visible' | 'hidden' | 'adaptive';
  subtitleVisibility?: 'visible' | 'hidden' | 'adaptive';
  useLegacyPinView?: boolean;
  onPress?: (e: MapEvent) => void;
  onSelect?: (e: MapEvent) => void;
  onDeselect?: (e: MapEvent) => void;
  onCalloutPress?: () => void;
  onDragStart?: (e: MapEvent) => void;
  onDrag?: (e: MapEvent) => void;
  onDragEnd?: (e: MapEvent) => void;
  children?: React.ReactNode;
};

export type CalloutProps = {
  tooltip?: boolean;
  alphaHitTest?: boolean;
  onPress?: () => void;
  children?: React.ReactNode;
};

export type PolylineProps = {
  coordinates: LatLng[];
  strokeWidth?: number;
  strokeColor?: string;
  strokeColors?: string[];
  fillColor?: string;
  lineCap?: 'butt' | 'round' | 'square';
  lineJoin?: 'miter' | 'round' | 'bevel';
  miterLimit?: number;
  geodesic?: boolean;
  lineDashPhase?: number;
  lineDashPattern?: number[];
  tappable?: boolean;
  onPress?: () => void;
};

export type PolygonProps = {
  coordinates: LatLng[];
  holes?: LatLng[][];
  strokeWidth?: number;
  strokeColor?: string;
  fillColor?: string;
  lineCap?: 'butt' | 'round' | 'square';
  lineJoin?: 'miter' | 'round' | 'bevel';
  miterLimit?: number;
  geodesic?: boolean;
  lineDashPhase?: number;
  lineDashPattern?: number[];
  tappable?: boolean;
  zIndex?: number;
  onPress?: () => void;
};

export type CircleProps = {
  center: LatLng;
  radius: number;
  strokeWidth?: number;
  strokeColor?: string;
  fillColor?: string;
  zIndex?: number;
  lineCap?: 'butt' | 'round' | 'square';
  lineJoin?: 'miter' | 'round' | 'bevel';
  miterLimit?: number;
  lineDashPhase?: number;
  lineDashPattern?: number[];
};

export type GeojsonProps = {
  geojson: any;
  strokeColor?: string;
  fillColor?: string;
  strokeWidth?: number;
  color?: string;
  lineDashPhase?: number;
  lineDashPattern?: number[];
  lineCap?: 'butt' | 'round' | 'square';
  lineJoin?: 'miter' | 'round' | 'bevel';
  miterLimit?: number;
  zIndex?: number;
  onPress?: (e: any) => void;
  markerComponent?: React.ReactNode;
  title?: string;
  tracksViewChanges?: boolean;
  anchor?: Point;
  centerOffset?: Point;
};

export type HeatmapProps = {
  points: Array<{ latitude: number; longitude: number; weight?: number }>;
  radius?: number;
  opacity?: number;
  gradient?: {
    colors: string[];
    startPoints: number[];
    colorMapSize?: number;
  };
};

export type OverlayProps = {
  image: any;
  bounds: [LatLng, LatLng];
  bearing?: number;
  tappable?: boolean;
  opacity?: number;
  onPress?: () => void;
};

export type URLTileProps = {
  urlTemplate: string;
  minimumZ?: number;
  maximumZ?: number;
  maximumNativeZ?: number;
  zIndex?: number;
  tileSize?: number;
  doubleTileSize?: boolean;
  shouldReplaceMapContent?: boolean;
  flipY?: boolean;
  tileCachePath?: string;
  tileCacheMaxAge?: number;
  offlineMode?: boolean;
  opacity?: number;
};

export type WMSTileProps = {
  urlTemplate: string;
  minimumZ?: number;
  maximumZ?: number;
  maximumNativeZ?: number;
  zIndex?: number;
  tileSize?: number;
  opacity?: number;
};

export type CalloutSubviewProps = {
  onPress?: () => void;
  children?: React.ReactNode;
};

// Hook for MapView component
export interface UseMapViewFunc {
  containerRef: React.RefObject<HTMLDivElement | null>;
  region: Region;
  size: { w: number; h: number };
  toXY: (c: LatLng) => { x: number; y: number };
  handleClick: (e: React.MouseEvent) => void;
  getImperativeHandle: () => MapViewImperative;
}

export function useMapView(props: MapViewProps): UseMapViewFunc {
  const { initialRegion, region: controlled, onPress, onRegionChange, onRegionChangeComplete, onMapReady } = props;

  const containerRef = useRef<HTMLDivElement | null>(null);

  const [region, setRegion] = useState<Region>(
    () =>
      controlled ??
      initialRegion ?? {
        latitude: 0,
        longitude: 0,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      },
  );

  // controlled support
  useEffect(() => {
    if (controlled) setRegion(controlled);
  }, [controlled]);

  // size
  const [size, setSize] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = containerRef.current!;
    const ro = new ResizeObserver(([entry]) => {
      const cr = entry.contentRect;
      setSize({ w: cr.width, h: cr.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const toXY = useCallback(
    (c: LatLng) => project(c.latitude, c.longitude, region, size.w || 1, size.h || 1),
    [region, size.w, size.h],
  );

  // pointer pan
  useEffect(() => {
    const el = containerRef.current!;
    let active = false;
    let start: { x: number; y: number } | null = null;
    let startRegion: Region | null = null;

    const onDown = (e: PointerEvent) => {
      active = true;
      start = { x: e.clientX, y: e.clientY };
      startRegion = region;
      (e.target as Element).setPointerCapture?.(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!active || !start || !startRegion) return;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      const lonDeltaPx = startRegion.longitudeDelta / (size.w || 1);
      const latDeltaPx = startRegion.latitudeDelta / (size.h || 1);
      const next = {
        ...startRegion,
        longitude: startRegion.longitude - dx * lonDeltaPx,
        latitude: startRegion.latitude + dy * latDeltaPx,
      };
      onRegionChange?.(next);
      setRegion(next);
    };
    const onUp = () => {
      if (!active) return;
      active = false;
      onRegionChangeComplete?.(region);
    };
    const onWheel = (e: WheelEvent) => {
      // zoom
      const factor = Math.exp(-e.deltaY * 0.001);
      const next = {
        ...region,
        latitudeDelta: region.latitudeDelta * factor,
        longitudeDelta: region.longitudeDelta * factor,
      };
      onRegionChange?.(next);
      setRegion(next);
      onRegionChangeComplete?.(next);
    };

    el.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    el.addEventListener('wheel', onWheel, { passive: true });

    return () => {
      el.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      el.removeEventListener('wheel', onWheel);
    };
  }, [region, size.w, size.h, onRegionChange, onRegionChangeComplete]);

  // click -> onPress(coord)
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const coord = unproject(x, y, region, rect.width, rect.height);
      onPress?.({ nativeEvent: { coordinate: coord, position: { x, y } } });
    },
    [region, onPress],
  );

  useEffect(() => {
    onMapReady?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // once

  const getImperativeHandle = useCallback(
    (): MapViewImperative => ({
      animateToRegion: (r, ms = 0) => {
        if (ms <= 0) {
          setRegion(r);
          onRegionChangeComplete?.(r);
          return;
        }
        // naive tween
        const start = performance.now();
        const from = region;
        function step(t: number) {
          const k = Math.min(1, (t - start) / ms);
          const lerp = (a: number, b: number) => a + (b - a) * k;
          const next = {
            latitude: lerp(from.latitude, r.latitude),
            longitude: lerp(from.longitude, r.longitude),
            latitudeDelta: lerp(from.latitudeDelta, r.latitudeDelta),
            longitudeDelta: lerp(from.longitudeDelta, r.longitudeDelta),
          };
          setRegion(next);
          if (k < 1) requestAnimationFrame(step);
          else onRegionChangeComplete?.(r);
        }
        requestAnimationFrame(step);
      },
      setCamera: () => {
        // no-op
      },
      animateCamera: () => {
        // no-op
      },
      fitToCoordinates: (coords) => {
        if (!coords?.length) return;
        const lats = coords.map((c) => c.latitude);
        const lons = coords.map((c) => c.longitude);
        const minLat = Math.min(...lats),
          maxLat = Math.max(...lats);
        const minLon = Math.min(...lons),
          maxLon = Math.max(...lons);
        const next: Region = {
          latitude: (minLat + maxLat) / 2,
          longitude: (minLon + maxLon) / 2,
          latitudeDelta: Math.max(1e-6, (maxLat - minLat) * 1.2),
          longitudeDelta: Math.max(1e-6, (maxLon - minLon) * 1.2),
        };
        setRegion(next);
        onRegionChangeComplete?.(next);
      },
      getCamera: async () => ({ center: { latitude: region.latitude, longitude: region.longitude }, zoom: 0 }),
    }),
    [region, onRegionChangeComplete],
  );

  return {
    containerRef,
    region,
    size,
    toXY,
    handleClick,
    getImperativeHandle,
  };
}

// Hook for Marker component
export interface UseMarkerFunc {
  handleClick: (e: React.MouseEvent) => void;
}

export function useMarker(props: MarkerProps): UseMarkerFunc {
  const { coordinate, onPress } = props;

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      onPress?.({ nativeEvent: { coordinate } });
      e.stopPropagation();
    },
    [coordinate, onPress],
  );

  return {
    handleClick,
  };
}

// Hook for Polyline component
export interface UsePolylineFunc {
  pathData: string;
}

export function usePolyline(props: PolylineProps, ctx: Ctx | null): UsePolylineFunc {
  const { coordinates } = props;

  const pathData = useMemo(() => {
    if (!ctx?.size.w || !ctx.size.h || coordinates.length < 2) return '';
    return coordinates
      .map((c) => {
        const p = ctx.toXY(c);
        return `${p.x},${p.y}`;
      })
      .join(' ');
  }, [coordinates, ctx]);

  return {
    pathData,
  };
}

// Hook for Polygon component
export interface UsePolygonFunc {
  pathData: string;
}

export function usePolygon(props: PolygonProps, ctx: Ctx | null): UsePolygonFunc {
  const { coordinates } = props;

  const pathData = useMemo(() => {
    if (!ctx?.size.w || !ctx.size.h || coordinates.length < 3) return '';
    return coordinates
      .map((c) => {
        const p = ctx.toXY(c);
        return `${p.x},${p.y}`;
      })
      .join(' ');
  }, [coordinates, ctx]);

  return {
    pathData,
  };
}

// Hook for Circle component
export interface UseCircleFunc {
  centerXY: { x: number; y: number };
  radiusX: number;
  radiusY: number;
}

export function useCircle(props: CircleProps, ctx: Ctx | null): UseCircleFunc {
  const { center, radius } = props;

  const centerXY = useMemo(() => {
    if (!ctx?.size.w || !ctx.size.h) return { x: 0, y: 0 };
    return ctx.toXY(center);
  }, [center, ctx]);

  const { radiusX, radiusY } = useMemo(() => {
    if (!ctx?.size.w || !ctx.size.h || radius <= 0) return { radiusX: 0, radiusY: 0 };

    // convert radius (meters) to roughly degrees at current latitude (approx; preview only)
    const METERS_PER_DEGREE_LATITUDE = 111_320;
    const degLat = radius / METERS_PER_DEGREE_LATITUDE;
    const degLon = degLat / Math.cos((Math.PI / 180) * ctx.region.latitude);

    const edge = { latitude: center.latitude + degLat, longitude: center.longitude + degLon };
    const exy = ctx.toXY(edge);
    const rx = Math.abs(exy.x - centerXY.x);
    const ry = Math.abs(exy.y - centerXY.y);

    return { radiusX: rx, radiusY: ry };
  }, [center, radius, ctx, centerXY]);

  return {
    centerXY,
    radiusX,
    radiusY,
  };
}
