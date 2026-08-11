import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3Geo from 'd3-geo';
import { Delaunay } from 'd3';
import { motion, AnimatePresence } from 'motion/react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Globe,
  Coins,
  Users,
  Swords,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';
import { loadWorldGeoJson, MapCountryFeature } from '../utils/mapLoader';
import { WORLD_COUNTRIES, Country, getCountryStats } from '../data/countries';
import { getCountryCities } from '../data/cities';
import { soundFx } from '../utils/sound';

export type MapMode = 'political' | 'economy' | 'population' | 'military' | 'relations';

interface AgeOfHistoryMapProps {
  playerCountryCode: string;
  selectedCountryCode: string | null;
  selectedCityId: string | null;
  onSelectCountry: (countryCode: string) => void;
  onSelectCity?: (cityId: string, countryCode: string) => void;
  mapMode: MapMode;
  conqueredCountryCodes: string[];
  conqueredCityIds: string[];
  alliedCountryCodes: string[];
  warCountryCodes: string[];
  troopCounts: Record<string, number>;
  activeMarchAnimation?: {
    sourceCityId: string;
    targetCityId: string;
    amount: number;
    type: 'transfer' | 'attack';
  } | null;
  activeBattleAnimation?: {
    targetCityId: string;
    winner: 'player' | 'target';
  } | null;
}

// Age of History signature country color scheme (authentic AOH2 / Victoria palette)
const COUNTRY_COLORS: Record<string, string> = {
  // Americas
  us: '#3a3867', // Deep Slate Indigo Blue (AOH2 USA)
  ca: '#8d1e1e', // Crimson Maroon (AOH2 Canada)
  mx: '#10b981', // Vivid Emerald Green (AOH2 Mexico)
  br: '#16a34a', // Bright Green (AOH2 Brazil)
  ar: '#62b6e5', // Sky Cyan Blue (AOH2 Argentina)
  co: '#85b927', // Olive Yellow-Green (AOH2 Colombia)
  pe: '#a82323', // Red Carmine (AOH2 Peru)
  cl: '#1d357e', // Navy Blue (AOH2 Chile)
  ve: '#38bdf8', // Light Cyan (AOH2 Venezuela)
  bo: '#4a5d23', // Dark Olive Green (AOH2 Bolivia)
  py: '#581c87', // Deep Violet (AOH2 Paraguay)
  uy: '#2dd4bf', // Teal (AOH2 Uruguay)
  cu: '#9f1239', // Crimson
  do: '#2563eb', // Blue
  gt: '#059669', // Green
  hn: '#d97706', // Ochre
  sv: '#0284c7', // Sky Blue
  ni: '#7c3aed', // Purple
  cr: '#16a34a', // Green
  pa: '#eab308', // Yellow
  gy: '#059669', // Emerald
  sr: '#eab308', // Yellow
  bz: '#2563eb', // Blue
  bs: '#38bdf8', // Cyan
  jm: '#16a34a', // Green
  ht: '#991b1b', // Red
  tt: '#d97706', // Orange
  bb: '#0284c7', // Blue

  // Europe
  ru: '#7f241a', // Crimson Rust / Soviet Red (AOH2 USSR / Russia)
  tr: '#dc2626', // Vibrant Red (AOH2 Turkey)
  de: '#3d493a', // Dark Grayish Slate (AOH2 Germany)
  gb: '#8e1b1b', // Maroon Red (AOH2 Great Britain)
  fr: '#1d4ed8', // Royal Cobalt Blue (AOH2 France)
  it: '#15803d', // Emerald Green (AOH2 Italy)
  es: '#b48312', // Ochre Gold (AOH2 Spain)
  pl: '#c87637', // Peach Terracotta (AOH2 Poland)
  ro: '#eab308', // Yellow (AOH2 Romania)
  ua: '#38bdf8', // Sky Blue
  by: '#8d1e1e', // Dark Maroon
  gr: '#1d4ed8', // Royal Blue
  nl: '#ea580c', // Orange
  be: '#ca8a04', // Gold
  ch: '#dc2626', // Red
  at: '#dc2626', // Red
  se: '#1e3a8a', // Dark Navy Blue
  no: '#8d1e1e', // Dark Red
  fi: '#42c295', // Mint Cyan (AOH2 Finland)
  dk: '#991b1b', // Red
  ie: '#16a34a', // Green
  pt: '#15803d', // Green
  cz: '#0284c7', // Blue
  hu: '#16a34a', // Green
  bg: '#15803d', // Green
  rs: '#1e3a8a', // Blue
  hr: '#1d4ed8', // Blue
  al: '#dc2626', // Red
  ba: '#2563eb', // Blue
  mk: '#d97706', // Orange
  me: '#8d1e1e', // Red
  md: '#ca8a04', // Gold
  lt: '#eab308', // Yellow
  lv: '#8d1e1e', // Red
  ee: '#0284c7', // Blue
  sk: '#2563eb', // Blue
  si: '#16a34a', // Green
  is: '#0284c7', // Blue
  lu: '#38bdf8', // Cyan
  mt: '#d97706', // Orange
  mc: '#dc2626', // Red
  ad: '#eab308', // Yellow
  sm: '#0284c7', // Blue
  li: '#2563eb', // Blue
  cy: '#d97706', // Amber
  va: '#f59e0b', // Gold

  // Middle East & North Africa
  sa: '#189345', // Bright Emerald Green (AOH2 Saudi Arabia)
  eg: '#d05315', // Terracotta Rust (AOH2 Egypt)
  dz: '#1d4ed8', // Cobalt Blue (AOH2 Algeria)
  ly: '#569223', // Olive Lime Green (AOH2 Libya)
  ir: '#45be70', // Soft Mint Green (AOH2 Iran)
  iq: '#b48312', // Golden Brown (AOH2 Iraq)
  sy: '#16a34a', // Green
  jo: '#ca8a04', // Gold
  lb: '#dc2626', // Red
  il: '#2563eb', // Blue
  ps: '#15803d', // Green
  ye: '#b91c1c', // Red
  om: '#16a34a', // Green
  ae: '#15803d', // Green
  qa: '#881337', // Maroon
  kw: '#15803d', // Green
  bh: '#dc2626', // Red

  // Asia & Caucasus
  cn: '#8ca929', // Yellowish Olive Green (AOH2 China)
  mn: '#42c295', // Pale Mint Cyan (AOH2 Mongolia)
  jp: '#d97706', // Amber Gold (AOH2 Japan)
  in: '#ab2020', // Terracotta Red (AOH2 India)
  pk: '#15803d', // Forest Green (AOH2 Pakistan)
  af: '#4a5d23', // Olive Green
  kz: '#4bb1e0', // Pale Cyan Blue
  uz: '#0284c7', // Blue
  tm: '#16a34a', // Green
  kg: '#dc2626', // Red
  tj: '#16a34a', // Green
  az: '#0284c7', // Blue
  ge: '#dc2626', // Red
  am: '#ea580c', // Orange
  kr: '#0284c7', // Sky Blue
  kp: '#991b1b', // Red
  tw: '#2563eb', // Blue
  vn: '#dc2626', // Red
  th: '#d97706', // Gold
  my: '#1e3a8a', // Dark Blue
  ph: '#2563eb', // Blue
  id: '#b91c1c', // Red
  sg: '#dc2626', // Red
  mm: '#eab308', // Yellow
  kh: '#2563eb', // Blue
  la: '#16a34a', // Green
  bd: '#15803d', // Green
  lk: '#d97706', // Orange
  np: '#dc2626', // Red
  bt: '#ea580c', // Orange
  bn: '#eab308', // Yellow
  tl: '#d97706', // Amber
  mv: '#0284c7', // Cyan

  // Africa
  za: '#b45309', // Terracotta Orange (AOH2 South Africa)
  ng: '#16a34a', // Green
  et: '#eab308', // Yellow
  ke: '#15803d', // Green
  tz: '#0284c7', // Blue
  ug: '#eab308', // Yellow
  sd: '#1d4ed8', // Royal Blue (AOH2 Sudan)
  ss: '#16a34a', // Green
  ao: '#dc2626', // Red
  cd: '#2563eb', // Blue
  cg: '#16a34a', // Green
  cm: '#15803d', // Green
  gh: '#ea580c', // Orange
  ci: '#ea580c', // Orange
  sn: '#15803d', // Green
  mg: '#2563eb', // Blue (AOH2 Madagascar)
  zm: '#16a34a', // Green
  zw: '#eab308', // Yellow
  mz: '#15803d', // Green
  ml: '#eab308', // Yellow
  ne: '#ea580c', // Orange
  td: '#1d4ed8', // Blue
  mr: '#15803d', // Green
  so: '#0284c7', // Blue
  dj: '#16a34a', // Green
  km: '#15803d', // Green
  tn: '#dc2626', // Red
  ma: '#dc2626', // Red
  rw: '#eab308', // Yellow
  bi: '#dc2626', // Red
  er: '#16a34a', // Green
  bf: '#dc2626', // Red
  bj: '#15803d', // Green
  tg: '#eab308', // Yellow
  gn: '#eab308', // Yellow
  gw: '#15803d', // Green
  lr: '#991b1b', // Red
  sl: '#16a34a', // Green
  gm: '#2563eb', // Blue
  gq: '#15803d', // Green
  ga: '#16a34a', // Green
  sz: '#2563eb', // Blue
  ls: '#0284c7', // Blue
  na: '#2563eb', // Blue
  bw: '#0284c7', // Blue
  mw: '#dc2626', // Red
  sc: '#dc2626', // Red
  mu: '#1d4ed8', // Blue
  cf: '#2563eb', // Blue
  cv: '#2563eb', // Blue
  st: '#15803d', // Green

  // Oceania
  au: '#a8281e', // Terracotta Red (AOH2 Australia)
  nz: '#1e3a8a', // Deep Blue
  pg: '#16a34a', // Green
  fj: '#0284c7', // Cyan
  vu: '#16a34a', // Green
  ws: '#dc2626', // Red
  to: '#dc2626', // Red
  sb: '#2563eb', // Blue
  ki: '#dc2626', // Red
  mh: '#0284c7', // Blue
  fm: '#2563eb', // Blue
  nr: '#0284c7', // Blue
  pw: '#0284c7', // Blue
  tv: '#0284c7', // Blue
};

// Deterministic fallback color for unmapped countries
function getFallbackColor(code: string): string {
  const PALETTE = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
    '#ec4899', '#06b6d4', '#84cc16', '#d97706', '#6366f1',
    '#14b8a6', '#eab308', '#a855f7', '#f97316', '#0284c7'
  ];
  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    hash = code.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export const AgeOfHistoryMap: React.FC<AgeOfHistoryMapProps> = ({
  playerCountryCode,
  selectedCountryCode,
  selectedCityId,
  onSelectCountry,
  onSelectCity,
  mapMode,
  conqueredCountryCodes,
  conqueredCityIds = [],
  alliedCountryCodes,
  warCountryCodes,
  troopCounts,
  activeMarchAnimation,
  activeBattleAnimation,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [features, setFeatures] = useState<MapCountryFeature[]>([]);
  const [loading, setLoading] = useState(true);

  // Zoom & Pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const latestPanRef = useRef({ x: 0, y: 0 });
  const dragRafRef = useRef<number | null>(null);

  // Hover state
  const [hoveredCountry, setHoveredCountry] = useState<Country | null>(null);
  const mousePosRef = useRef({ x: 0, y: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Helper to update floating tooltip position without triggering full React re-renders
  const updateTooltipPos = (x: number, y: number) => {
    mousePosRef.current = { x, y };
    if (tooltipRef.current) {
      const left = Math.min(x + 15, (containerRef.current?.clientWidth || 800) - 220);
      const top = Math.max(y - 80, 10);
      tooltipRef.current.style.left = `${left}px`;
      tooltipRef.current.style.top = `${top}px`;
    }
  };

  // Load Map Features on mount
  useEffect(() => {
    let mounted = true;
    loadWorldGeoJson().then((feats) => {
      if (mounted) {
        setFeatures(feats);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Projection setup
  const width = 1000;
  const height = 550;

  const projection = useMemo(() => {
    return d3Geo
      .geoNaturalEarth1()
      .scale(160)
      .translate([width / 2, height / 2 + 30]);
  }, []);

  const pathGenerator = useMemo(() => {
    return d3Geo.geoPath().projection(projection);
  }, [projection]);

  // Country Object Lookup
  const countryObjMap = useMemo(() => {
    const map: Record<string, Country> = {};
    WORLD_COUNTRIES.forEach((c) => {
      map[c.code.toLowerCase()] = c;
    });
    return map;
  }, []);

  // Compute Country Paths & Centroids & Area-Proportional Font Size & City Voronois
  const countryPathData = useMemo(() => {
    return features.map((feature) => {
      const code = feature.properties.code.toLowerCase();
      const pathD = pathGenerator(feature as any) || '';
      const centroid = pathGenerator.centroid(feature as any);
      const projArea = pathGenerator.area(feature as any) || 1;
      const projBounds = pathGenerator.bounds(feature as any);
      const boundsWidth = projBounds ? Math.max(projBounds[1][0] - projBounds[0][0], 1) : 10;
      const boundsHeight = projBounds ? Math.max(projBounds[1][1] - projBounds[0][1], 1) : 10;
      const dimension = Math.min(boundsWidth, boundsHeight);
      
      const boundsCenter: [number, number] = projBounds 
        ? [(projBounds[0][0] + projBounds[1][0]) / 2, (projBounds[0][1] + projBounds[1][1]) / 2]
        : [0, 0];
      let labelPoint = (centroid && !isNaN(centroid[0]) && !isNaN(centroid[1])) ? centroid : boundsCenter;

      // Special centroid overrides for complex or multi-island countries to center on mainland
      const overrides: Record<string, [number, number]> = {
        us: [-98.5, 39.5],
        fr: [2.5, 46.5],
        ru: [95.0, 60.0],
        ca: [-106.0, 56.0],
        no: [8.5, 61.0],
        es: [-3.7, 40.4],
        pt: [-8.2, 39.5],
        tr: [35.2, 39.0],
        gb: [-1.8, 53.5],
        gr: [22.5, 39.0],
        it: [12.8, 42.8],
        cl: [-71.5, -35.0],
        jp: [138.0, 36.0],
        id: [115.0, -1.0],
        dk: [9.5, 56.0],
        nl: [5.3, 52.1],
        se: [15.0, 62.0],
        fi: [26.0, 64.0],
        br: [-52.0, -14.0],
        ar: [-65.0, -38.0],
        in: [78.0, 22.0],
        cn: [104.0, 35.0],
        au: [134.0, -25.0],
        eg: [30.0, 26.0],
        sa: [45.0, 24.0],
        ir: [53.0, 32.0],
        de: [10.0, 51.2],
        pl: [19.5, 52.0],
        ua: [31.0, 49.0],
        mx: [-102.0, 23.5],
        za: [25.0, -29.0],
        ph: [122.5, 13.0],
        nz: [172.5, -41.0],
        vn: [108.0, 16.0],
        my: [102.0, 4.0],
        th: [101.0, 15.0],
        dz: [3.0, 28.0],
        pk: [69.0, 30.0],
        iq: [44.0, 33.0],
        sy: [38.0, 35.0],
        kz: [68.0, 48.0],
        uz: [64.0, 41.5],
        ro: [25.0, 46.0],
        ma: [-6.5, 32.0],
      };
      if (overrides[code]) {
        const pt = projection(overrides[code]);
        if (pt) labelPoint = pt as [number, number];
      }

      // Calculate proportional font size and rotation angle based on country physical dimensions on map
      const countryName = (countryObjMap[code] ? countryObjMap[code].name : feature.properties.name) || '';
      const charCount = countryName.length || 1;

      // In Age of History, font size scales proportionally with country land area & bounding span, perfectly balanced (not too big, big countries larger, small countries smaller):
      const areaSqrt = Math.sqrt(projArea);
      const span = Math.max(boundsWidth, boundsHeight);
      const sizeFromArea = areaSqrt * 0.22;
      const sizeFromSpan = span * 0.28;
      const sizeFromCharWidth = (boundsWidth * 0.70) / (charCount * 0.60);

      let calculatedSize = Math.min(Math.max(sizeFromArea, sizeFromSpan * 0.4), sizeFromCharWidth);
      const labelFontSize = Math.min(Math.max(calculatedSize, 0.8), 7.5);

      // Specific geographical tilt angle for countries
      const angleOverrides: Record<string, number> = {
        cl: -78,
        ar: -62,
        vn: -68,
        no: -70,
        se: -62,
        fi: -72,
        it: -48,
        jp: -52,
        gb: -32,
        nz: -58,
        ph: -72,
        pt: -78,
        mg: -62,
        mx: -25,
        br: -18,
        in: -12,
        sa: -12,
        ir: -10,
        ru: -5,
        us: -3,
        ca: -3,
        tr: -2,
        cn: -4,
        au: -3,
        eg: -2,
        de: -2,
        fr: -2,
        es: -2,
        id: -5,
        ua: -4,
        kz: -4,
        pk: -30,
      };

      let labelAngle = angleOverrides[code] ?? 0;
      if (labelAngle === 0) {
        if (boundsWidth > boundsHeight * 2.2) {
          labelAngle = -5;
        } else if (boundsHeight > boundsWidth * 1.8) {
          labelAngle = -65;
        } else if (boundsWidth > boundsHeight * 1.3) {
          labelAngle = -3;
        }
      }

      const rawFontSize = Math.min(Math.max(dimension * 0.38, Math.sqrt(projArea) * 0.3, 1.2), 16);

      // Compute curved text path along country geographical orientation (Age of History style)
      const rad = (labelAngle * Math.PI) / 180;
      const maxSpan = Math.max(boundsWidth, boundsHeight);
      const arcLen = Math.max(maxSpan * 0.38, (charCount * labelFontSize * 0.6) / 2);

      const vx = Math.cos(rad);
      const vy = Math.sin(rad);
      const nx = -vy;
      const ny = vx;
      const arcHeight = arcLen * 0.08;

      const x1 = labelPoint[0] - vx * arcLen;
      const y1 = labelPoint[1] - vy * arcLen;
      const x2 = labelPoint[0] + vx * arcLen;
      const y2 = labelPoint[1] + vy * arcLen;
      const qx = labelPoint[0] + nx * arcHeight;
      const qy = labelPoint[1] + ny * arcHeight;

      const textPathD = `M ${x1.toFixed(2)},${y1.toFixed(2)} Q ${qx.toFixed(2)},${qy.toFixed(2)} ${x2.toFixed(2)},${y2.toFixed(2)}`;

      // Generate Voronoi cells for cities to create provinces
      const cities = getCountryCities(code);
      const cityPoints: [number, number][] = [];
      const provinces: { isImportant: boolean; cityData?: any; x: number; y: number; voronoiPath: string }[] = [];

      cities.forEach(city => {
        let pt: [number, number] = [0, 0];
        if (city.isFallback && labelPoint) pt = labelPoint;
        else {
          const coords = projection([city.lng, city.lat]);
          if (coords) pt = coords as [number, number];
        }
        cityPoints.push(pt);
        provinces.push({ isImportant: true, cityData: city, x: pt[0], y: pt[1], voronoiPath: '' });
      });
      
      const dummyPoints: [number, number][] = [];
      
      const allProvincePoints = provinces.map(p => [p.x, p.y] as [number, number]);
      let cityVoronoi: string[] = [];
      
      if (projBounds && allProvincePoints.length > 0) {
        try {
          const delaunay = Delaunay.from(allProvincePoints);
          const margin = 20; 
          const voronoi = delaunay.voronoi([
            projBounds[0][0] - margin,
            projBounds[0][1] - margin,
            projBounds[1][0] + margin,
            projBounds[1][1] + margin
          ]);
          provinces.forEach((prov, i) => {
            prov.voronoiPath = voronoi.renderCell(i);
          });
          cityVoronoi = provinces.map(p => p.voronoiPath);
        } catch (e) {
          console.warn("Could not generate Voronoi for", code, e);
        }
      }

      return {
        feature,
        code,
        pathD,
        centroid,
        labelPoint,
        projArea,
        dimension,
        boundsWidth,
        boundsHeight,
        rawFontSize,
        labelAngle,
        labelFontSize,
        textPathD,
        provinces,
        cityVoronoi,
        projBounds,
      };
    });
  }, [features, pathGenerator, projection, countryObjMap]);

  const centroidMap = useMemo(() => {
    const map: Record<string, [number, number]> = {};
    countryPathData.forEach((d) => {
      if (d.centroid && !isNaN(d.centroid[0]) && !isNaN(d.centroid[1])) {
        map[d.code] = d.centroid;
      }
    });
    return map;
  }, [countryPathData]);

  // Handle Dragging / Panning
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click drag
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    latestPanRef.current = { x: pan.x, y: pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const nextX = e.clientX - dragStartRef.current.x;
      const nextY = e.clientY - dragStartRef.current.y;
      latestPanRef.current = { x: nextX, y: nextY };

      if (dragRafRef.current === null) {
        dragRafRef.current = requestAnimationFrame(() => {
          dragRafRef.current = null;
          setPan(latestPanRef.current);
        });
      }
    } else if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      updateTooltipPos(x, y);
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      if (dragRafRef.current !== null) {
        cancelAnimationFrame(dragRafRef.current);
        dragRafRef.current = null;
      }
      setPan(latestPanRef.current);
    }
  };

  // Helper to zoom at a specific pixel position (e.g., mouse position or center)
  const zoomAtPoint = (targetZoom: number, clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;

    const newZoom = Math.min(Math.max(targetZoom, 0.7), 40);
    if (newZoom === zoom) return;

    // Calculate new pan so mouse location on map stays stationary relative to screen
    const zoomRatio = newZoom / zoom;
    const newPanX = mouseX - zoomRatio * (mouseX - pan.x);
    const newPanY = mouseY - zoomRatio * (mouseY - pan.y);

    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  };

  // Wheel Zoom focused on mouse cursor
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.25 : 0.8;
    zoomAtPoint(zoom * zoomFactor, e.clientX, e.clientY);
  };

  // Get fill color based on map mode
  const getCountryFill = (code: string) => {
    const codeLower = code.toLowerCase();
    const playerCodeLower = playerCountryCode.toLowerCase();

    // If conquered by player, use player country's native political color
    if (conqueredCountryCodes.includes(codeLower)) {
      return COUNTRY_COLORS[playerCodeLower] || getFallbackColor(playerCodeLower);
    }

    if (mapMode === 'relations') {
      if (codeLower === playerCodeLower) return '#2563eb'; // Player Blue
      if (alliedCountryCodes.includes(codeLower)) return '#10b981'; // Ally Emerald
      if (warCountryCodes.includes(codeLower)) return '#ef4444'; // War Crimson
      return '#475569'; // Neutral Slate
    }

    if (mapMode === 'economy') {
      const country = countryObjMap[codeLower];
      if (!country) return '#1e293b';
      const stats = getCountryStats(country);
      if (stats.defenseBudget.includes('Milyar')) {
        const val = parseFloat(stats.defenseBudget.replace(/[^0-9.]/g, ''));
        if (val > 50) return '#10b981'; // Top economy
        if (val > 10) return '#f59e0b'; // Medium
        return '#3b82f6';
      }
      return '#64748b';
    }

    if (mapMode === 'population') {
      const country = countryObjMap[codeLower];
      if (!country) return '#1e293b';
      const stats = getCountryStats(country);
      if (stats.population.includes('Milyar')) return '#a855f7';
      const popVal = parseFloat(stats.population.replace(/[^0-9.]/g, ''));
      if (popVal > 100) return '#ec4899';
      if (popVal > 40) return '#f97316';
      if (popVal > 10) return '#06b6d4';
      return '#334155';
    }

    if (mapMode === 'military') {
      const country = countryObjMap[codeLower];
      if (!country) return '#0f172a';
      if (codeLower === playerCodeLower) return '#ef4444';
      if (warCountryCodes.includes(codeLower)) return '#991b1b';
      return '#1e293b';
    }

    // Default Political Mode: Each country (including player country) retains its own native political color
    return COUNTRY_COLORS[codeLower] || getFallbackColor(codeLower);
  };

  // Helper to find city coordinates by ID
  const cityCoordsMap = useMemo(() => {
    const map: Record<string, [number, number]> = {};
    countryPathData.forEach(d => {
      d.provinces.forEach(p => {
        if (p.cityData) {
          map[p.cityData.id] = [p.x, p.y];
        }
      });
    });
    return map;
  }, [countryPathData]);

  // Calculate SVG Viewport bounds with safety margin for Viewport Culling (60 FPS performance optimization)
  const containerW = containerRef.current?.clientWidth || width;
  const containerH = containerRef.current?.clientHeight || height;
  const scaleRatio = Math.min(containerW / width, containerH / height) || 1;

  // Transform inversion from container pixels to SVG viewBox coordinates
  const svgLeft = -pan.x / (scaleRatio * zoom);
  const svgTop = -pan.y / (scaleRatio * zoom);
  const svgVisibleW = containerW / (scaleRatio * zoom);
  const svgVisibleH = containerH / (scaleRatio * zoom);

  // Generous 300 SVG unit safety margin prevents any clipping glitches while keeping performance high
  const minSvgX = svgLeft - 300;
  const maxSvgX = svgLeft + svgVisibleW + 300;
  const minSvgY = svgTop - 300;
  const maxSvgY = svgTop + svgVisibleH + 300;

  return (
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onClick={(e) => {
          // If we clicked the container directly (the background), deselect
          if (e.target === containerRef.current || (e.target as HTMLElement).tagName === 'svg') {
            onSelectCountry('');
            if (onSelectCity) onSelectCity('', '');
          }
        }}
        className="relative w-full h-full bg-[#050811] overflow-hidden select-none cursor-grab active:cursor-grabbing font-cinzel"
      >
      {/* Background Ocean Grids & Atmosphere */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#0d1627] via-[#070b14] to-[#020409] pointer-events-none" />
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(#38bdf8 1px, transparent 1px), radial-gradient(#38bdf8 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          backgroundPosition: '0 0, 20px 20px',
        }}
      />

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md text-slate-200">
          <Globe className="w-12 h-12 text-red-500 animate-spin mb-3" />
          <p className="text-sm font-cinzel font-bold tracking-widest text-amber-400">
            DÜNYA HARİTASI VE HARİTA BÖLGELERİ YÜKLENİYOR...
          </p>
        </div>
      )}

      {/* Zoom / Reset Controls */}
      <div className="absolute bottom-6 right-6 z-20 flex flex-col items-center space-y-2 bg-slate-950/90 p-1.5 rounded-lg border border-slate-800 shadow-2xl backdrop-blur-md">
        <div className="text-[9px] font-mono font-bold text-amber-400/90 px-1 pt-0.5">
          {zoom.toFixed(1)}x
        </div>
        <button
          onClick={() => {
            soundFx.playClick();
            if (containerRef.current) {
              const rect = containerRef.current.getBoundingClientRect();
              zoomAtPoint(zoom * 1.35, rect.left + rect.width / 2, rect.top + rect.height / 2);
            } else {
              setZoom((z) => Math.min(z * 1.35, 40));
            }
          }}
          className="p-2 text-slate-300 hover:text-amber-400 hover:bg-slate-900 rounded transition"
          title="Yakınlaştır (40x)"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <button
          onClick={() => {
            soundFx.playClick();
            if (containerRef.current) {
              const rect = containerRef.current.getBoundingClientRect();
              zoomAtPoint(zoom / 1.35, rect.left + rect.width / 2, rect.top + rect.height / 2);
            } else {
              setZoom((z) => Math.max(z / 1.35, 0.7));
            }
          }}
          className="p-2 text-slate-300 hover:text-amber-400 hover:bg-slate-900 rounded transition"
          title="Uzaklaştır"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <button
          onClick={() => {
            soundFx.playClick();
            setZoom(1);
            setPan({ x: 0, y: 0 });
          }}
          className="p-2 text-slate-300 hover:text-amber-400 hover:bg-slate-900 rounded transition"
          title="Haritayı Sıfırla"
        >
          <Maximize2 className="w-5 h-5" />
        </button>
      </div>

      {/* Map Mode Legend Indicator */}
      <div className="absolute top-4 left-6 z-20 flex items-center space-x-2 bg-slate-950/90 px-3.5 py-2 rounded-lg border border-slate-800 backdrop-blur-md shadow-xl text-xs font-cinzel">
        <Layers className="w-4 h-4 text-amber-400" />
        <span className="text-slate-400">MOD:</span>
        <span className="font-bold text-slate-100 uppercase">
          {mapMode === 'political' && '🗺️ Siyasi Harita'}
          {mapMode === 'economy' && '💰 Ekonomi Haritası'}
          {mapMode === 'population' && '👥 Nüfus Haritası'}
          {mapMode === 'military' && '⚔️ Ordu & Askeri Harita'}
          {mapMode === 'relations' && '🤝 Diplomasi Haritası'}
        </span>
      </div>

      {/* Main Interactive SVG Map */}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          transition: isDragging ? 'none' : 'transform 0.12s ease-out',
        }}
      >
        <g>
          {/* Active Marching Troops / Attack Arrow Animation */}
          {activeMarchAnimation && cityCoordsMap[activeMarchAnimation.sourceCityId] && cityCoordsMap[activeMarchAnimation.targetCityId] && (
            (() => {
              const [x1, y1] = cityCoordsMap[activeMarchAnimation.sourceCityId];
              const [x2, y2] = cityCoordsMap[activeMarchAnimation.targetCityId];

              // Offscreen Culling Check for marching troop animation
              const marchMinX = Math.min(x1, x2) - 50;
              const marchMaxX = Math.max(x1, x2) + 50;
              const marchMinY = Math.min(y1, y2) - 50;
              const marchMaxY = Math.max(y1, y2) + 50;
              if (marchMaxX < minSvgX || marchMinX > maxSvgX || marchMaxY < minSvgY || marchMinY > maxSvgY) {
                return null;
              }

              const mx = (x1 + x2) / 2;
              const my = (y1 + y2) / 2; // Removed the -20 arc to stay on "land"
              const pathString = `M ${x1} ${y1} L ${x2} ${y2}`; // Changed to straight line for land march
              const isAttack = activeMarchAnimation.type === 'attack';

              return (
                <g className="pointer-events-none z-30">
                  {/* The Path Line */}
                  <motion.path
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 0.4 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8 }}
                    d={pathString}
                    fill="none"
                    stroke={isAttack ? '#ef4444' : '#38bdf8'}
                    strokeWidth={1.5 / zoom}
                    strokeDasharray="4,4"
                  />
                  
                  {/* Classic Age of History style black marching dots convoy */}
                  {[0, 1, 2, 3, 4].map((i) => (
                    <motion.g 
                      key={`${activeMarchAnimation.sourceCityId}-${activeMarchAnimation.targetCityId}-${i}`}
                      animate={{ 
                        offsetDistance: ["0%", "100%"]
                      }}
                      transition={{ 
                        duration: 3,
                        repeat: Infinity,
                        ease: "linear",
                        delay: i * 0.4
                      }}
                      style={{ 
                        offsetPath: `path("${pathString}")`,
                        offsetRotate: "auto"
                      }}
                    >
                      <g transform={`scale(${1 / Math.sqrt(zoom)})`}>
                        <circle
                          r="3.5"
                          fill="#000000"
                          stroke="#ffffff"
                          strokeWidth="0.8"
                        />
                      </g>
                    </motion.g>
                  ))}

                  {/* Info Badge moving with the unit column */}
                  <motion.g 
                    initial={{ offsetDistance: "0%", opacity: 0 }}
                    animate={{ offsetDistance: "100%", opacity: 1 }}
                    transition={{ 
                      offsetDistance: { duration: 3.5, ease: "linear", delay: 0.3 },
                      opacity: { duration: 0.3, delay: 0.3 }
                    }}
                    style={{ 
                      offsetPath: `path("${pathString}")`,
                      offsetRotate: "0deg"
                    }}
                  >
                    <g transform={`translate(0, -8) scale(${0.35 / Math.sqrt(zoom)})`}>
                      <rect
                        x="-16"
                        y="-8"
                        width="32"
                        height="12"
                        rx="2"
                        fill="#020617"
                        fillOpacity="0.8"
                        stroke={isAttack ? '#ef4444' : '#38bdf8'}
                        strokeWidth="0.5"
                      />
                      <text
                        x="0"
                        y="1"
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="5"
                        fontWeight="bold"
                      >
                        {isAttack ? 'SALDIRI' : 'SEVK'}
                      </text>
                    </g>
                  </motion.g>
                </g>
              );
            })()
          )}

          {/* Active Battle Clash / Explosion Animation */}
          {activeBattleAnimation && cityCoordsMap[activeBattleAnimation.targetCityId] && (
            (() => {
              const [bx, by] = cityCoordsMap[activeBattleAnimation.targetCityId];
              if (bx < minSvgX || bx > maxSvgX || by < minSvgY || by > maxSvgY) {
                return null;
              }
              return (
                <g transform={`translate(${bx}, ${by}) scale(${1 / Math.sqrt(zoom)})`} className="pointer-events-none z-40">
                  <circle r="36" fill="none" stroke="#ef4444" strokeWidth="3" className="animate-ping opacity-90" />
                  <circle r="22" fill="#dc2626" fillOpacity="0.8" className="animate-pulse" />
                  <text x="0" y="6" textAnchor="middle" fontSize="20">
                    💥⚔️
                  </text>
                </g>
              );
            })()
          )}

          {countryPathData.map(({ feature, code, pathD, centroid, labelPoint, projBounds, rawFontSize, labelAngle, labelFontSize, textPathD, boundsWidth, boundsHeight, cityVoronoi, provinces }, idx) => {
            if (!pathD) return null;

            // Viewport Culling Check (60 FPS Optimization):
            // If the country is outside the visible SVG viewport bounds, skip rendering completely
            const isInViewport = (() => {
              if (!projBounds) return true;
              const [bMinX, bMinY] = projBounds[0];
              const [bMaxX, bMaxY] = projBounds[1];
              return !(bMaxX < minSvgX || bMinX > maxSvgX || bMaxY < minSvgY || bMinY > maxSvgY);
            })();

            // Culling optimization: Skip rendering any offscreen country
            if (!isInViewport) {
              return null;
            }

            const isPlayer = code === playerCountryCode.toLowerCase();
            const isSelected = code === selectedCountryCode?.toLowerCase();
            const isHovered = hoveredCountry?.code.toLowerCase() === code;
            const isWar = warCountryCodes.includes(code);
            const countryObj = countryObjMap[code];
            const fillColor = getCountryFill(code);

            const troops = troopCounts[code] || (countryObj ? 45000 : 10000);
            const uniqueKey = `map-feat-${idx}-${code || 'unmapped'}-${feature.id || 'roid'}`;

            const hasCityInteraction = true;

            return (
              <g key={uniqueKey}>
                {/* ClipPath Definition for City Voronoi (only rendered when needed) */}
                {cityVoronoi && cityVoronoi.length > 0 && hasCityInteraction && (
                  <defs>
                    <clipPath id={`clip-${uniqueKey}`}>
                      <path d={pathD} />
                    </clipPath>
                  </defs>
                )}

                {/* Base Country Fill */}
                <path
                  d={pathD}
                  fill={fillColor}
                  fillOpacity={isHovered ? 0.95 : isSelected ? 0.9 : 0.75}
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    soundFx.playClick();
                    onSelectCountry(code);
                  }}
                />

                {/* City Provinces (Voronoi cells - visible at zoom >= 18x or when city is selected) */}
                {cityVoronoi && cityVoronoi.length > 0 && provinces && hasCityInteraction && (
                  <g clipPath={`url(#clip-${uniqueKey})`} className="voronoi-layer">
                    {provinces.map((prov, i) => {
                      const cityId = prov.cityData?.id;
                      const isCitySelected = cityId && cityId === selectedCityId;
                      const isCityConquered = cityId && conqueredCityIds.includes(cityId) && !isPlayer;
                      const hasSelectedCity = selectedCityId ? provinces?.some(p => p.cityData?.id === selectedCityId) || getCountryCities(code).some(c => c.id === selectedCityId) : false;
                      const showBoundaries = isCitySelected || isSelected || hasSelectedCity;

                      // Skip rendering if not selected, not conquered, and boundaries shouldn't be shown
                      if (!isCitySelected && !isCityConquered && !showBoundaries) {
                        return null;
                      }

                      let fill = "transparent";
                      let fillOpacity = 0;
                      let stroke = showBoundaries ? "#000000" : "none";
                      let strokeWidth = 0.3 / zoom;
                      let strokeOpacity = 0.35;

                      if (isCitySelected) {
                        fill = "#38bdf8";
                        fillOpacity = 0.4;
                        stroke = "#ffffff";
                        strokeWidth = 1.5 / zoom;
                        strokeOpacity = 0.9;
                      } else if (isCityConquered) {
                        fill = getCountryFill(playerCountryCode);
                        fillOpacity = 0.8;
                      }

                      return (
                        <path
                          key={`voronoi-${uniqueKey}-${i}`}
                          d={prov.voronoiPath}
                          fill={fill}
                          fillOpacity={fillOpacity}
                          stroke={stroke}
                          strokeWidth={strokeWidth}
                          strokeOpacity={strokeOpacity}
                          className="cursor-pointer hover:fill-sky-400/20"
                          pointerEvents="all"
                          onClick={(e) => {
                            if (prov.cityData && onSelectCity) {
                              e.stopPropagation();
                              soundFx.playClick();
                              onSelectCity(prov.cityData.id, code);
                            }
                          }}
                        />
                      );
                    })}
                  </g>
                )}

                {/* Interactive Country Outline */}
                <path
                  d={pathD}
                  fill="transparent"
                  stroke={
                    isSelected
                      ? '#f59e0b'
                      : isPlayer
                      ? '#ef4444'
                      : isHovered
                      ? '#38bdf8'
                      : isWar
                      ? '#dc2626'
                      : '#1e293b'
                  }
                  strokeWidth={
                    isSelected ? 2 / zoom : isHovered ? 1.5 / zoom : isPlayer ? 1.5 / zoom : 0.5 / zoom
                  }
                  className="cursor-pointer"
                  pointerEvents="stroke"
                  onClick={(e) => {
                    e.stopPropagation();
                    soundFx.playClick();
                    onSelectCountry(code);
                  }}
                  onMouseEnter={() => {
                    if (countryObj) {
                      setHoveredCountry(countryObj);
                    }
                  }}
                  onMouseLeave={() => {
                    setHoveredCountry(null);
                  }}
                />

                {/* Country Capital / Troop Badge / Country Label Overlay */}
                {labelPoint && !isNaN(labelPoint[0]) && !isNaN(labelPoint[1]) && (
                  <g className="pointer-events-none">
                    {/* Country Name Label with Level-of-Detail (LOD) filtering based on zoom level */}
                    {(() => {
                      const isHovered = hoveredCountry?.code === code;
                      const displayName = countryObj ? countryObj.name : feature.properties.name;

                      // In Age of History, country names are drawn directly in map world coordinates,
                      // so they scale naturally up and down with the map terrain when zooming!
                      const finalFontSize = labelFontSize;

                      // Calculate the label's height in screen pixels at the current zoom level
                      const labelScreenPixels = finalFontSize * zoom;

                      // Level-of-Detail (LOD) filter:
                      // Show label if it's readable on screen (at least 2.2px high), or if it is player, selected, or hovered country
                      const showLabel =
                        isPlayer ||
                        isSelected ||
                        isHovered ||
                        labelScreenPixels >= 2.2;

                      if (!showLabel) return null;

                      const labelPathId = `lbl-path-${code}-${idx}`;

                      return (
                        <g key={`lbl-grp-${code}-${idx}`} className="pointer-events-none">
                          <defs>
                            <path id={labelPathId} d={textPathD} />
                          </defs>
                          <text
                            fill={isPlayer ? '#fef08a' : '#f8fafc'}
                            fillOpacity={0.95}
                            stroke="#000000"
                            strokeWidth={Math.max(finalFontSize * 0.18, 0.4)}
                            style={{ paintOrder: 'stroke fill', strokeLinejoin: 'round' }}
                            fontSize={finalFontSize}
                            fontWeight="800"
                            letterSpacing={Math.max(finalFontSize * 0.18, 0.3)}
                            fontFamily="Cinzel, Georgia, serif"
                            className="uppercase select-none pointer-events-none transition-opacity duration-200"
                          >
                            <textPath href={`#${labelPathId}`} startOffset="50%" textAnchor="middle">
                              {displayName}
                            </textPath>
                          </text>
                        </g>
                      );
                    })()}

                    {/* Selected Golden Halo */}
                    {isSelected && (
                      <circle
                        r="12"
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="2"
                        className="animate-ping opacity-75"
                      />
                    )}

                    {/* Flag / Crest Pin for Player & Major Countries */}
                    {(isPlayer || isSelected || isWar || (mapMode === 'military' && zoom < 18)) && (
                      <g transform="translate(-10, -10)">
                        <rect
                          x="0"
                          y="0"
                          width="20"
                          height="12"
                          rx="2"
                          fill="#0f172a"
                          stroke={isSelected ? '#f59e0b' : isPlayer ? '#ef4444' : '#475569'}
                          strokeWidth="1"
                        />
                        {countryObj && (
                          <text x="10" y="9" textAnchor="middle" fontSize="8">
                            {countryObj.emoji}
                          </text>
                        )}
                      </g>
                    )}

                    {/* Military Troop Badge in Military Mode or War (Aggregated at country level only when zoomed out < 18x) */}
                    {(mapMode === 'military' || isWar || isPlayer) && zoom < 18 && (
                      <g transform="translate(-16, 6)">
                        <rect
                          x="0"
                          y="0"
                          width="32"
                          height="10"
                          rx="3"
                          fill="#020617"
                          fillOpacity="0.9"
                          stroke={isPlayer ? '#ef4444' : isWar ? '#dc2626' : '#334155'}
                          strokeWidth="0.8"
                        />
                        <text
                          x="16"
                          y="7.5"
                          textAnchor="middle"
                          fill="#f8fafc"
                          fontSize="6.5"
                          fontWeight="bold"
                          fontFamily="sans-serif"
                        >
                          {(() => {
                            // Aggregate all city troops for this country
                            const cities = getCountryCities(code);
                            const totalTroops = cities.reduce((acc, city) => acc + (troopCounts[city.id] || 0), 0);
                            return (totalTroops / 1000).toFixed(0);
                          })()}k ⚔️
                        </text>
                      </g>
                    )}
                  </g>
                )}
              </g>
            );
          })}
          {/* Real-world Coordinate City Markers Layer (Visible when country or city is selected) */}
          {(selectedCountryCode || selectedCityId) && (
            <g className="cities-layer">
              {countryPathData.map(({ code, centroid, projBounds, provinces }) => {
                if (projBounds) {
                  const [bMinX, bMinY] = projBounds[0];
                  const [bMaxX, bMaxY] = projBounds[1];
                  if (bMaxX < minSvgX || bMinX > maxSvgX || bMaxY < minSvgY || bMinY > maxSvgY) {
                    return null; // Skip cities for offscreen countries
                  }
                }
                const isSelected = code === selectedCountryCode?.toLowerCase();
                const hasSelectedCity = selectedCityId ? provinces?.some(p => p.cityData?.id === selectedCityId) || getCountryCities(code).some(c => c.id === selectedCityId) : false;
                if (!isSelected && !hasSelectedCity) {
                  return null;
                }
                const cities = getCountryCities(code);
                const isPlayerCountry = code === playerCountryCode.toLowerCase();
                return cities.map((city) => {
                  let cx = 0, cy = 0;
                  if (city.isFallback && centroid) {
                    cx = centroid[0];
                    cy = centroid[1];
                  } else {
                    const coords = projection([city.lng, city.lat]);
                    if (!coords || isNaN(coords[0]) || isNaN(coords[1])) return null;
                    cx = coords[0];
                    cy = coords[1];
                  }

                  // Offscreen Culling for individual city marker
                  if (cx < minSvgX || cx > maxSvgX || cy < minSvgY || cy > maxSvgY) {
                    return null;
                  }

                  const isCityConquered = conqueredCityIds.includes(city.id) || isPlayerCountry || conqueredCountryCodes.includes(code);
                  
                  // 1 / zoom counteracts the map's zoom scale, keeping markers visually clear and sized on screen
                  const scaleFactor = 1 / zoom;
                  const isSelectedCity = city.id === selectedCityId;

                  return (
                    <g 
                      key={city.id} 
                      transform={`translate(${cx}, ${cy}) scale(${isSelectedCity ? scaleFactor * 1.4 : scaleFactor})`} 
                      className="cursor-pointer group"
                      onClick={(e) => {
                        e.stopPropagation();
                        soundFx.playClick();
                        if (onSelectCity) onSelectCity(city.id, code);
                      }}
                    >
                      {/* Invisible hit area */}
                      <circle r={12} fill="transparent" />

                      {/* Highlight Ring for Selected City */}
                      {isSelectedCity && (
                        <circle r={9} fill="none" stroke="#38bdf8" strokeWidth="2" />
                      )}

                      {/* City Marker Icon / Dot */}
                      {city.isCapital ? (
                        <text x="0" y="4" textAnchor="middle" fontSize="14" className="select-none pointer-events-none">⭐</text>
                      ) : (
                        <g>
                          <circle
                            r={5}
                            fill={isCityConquered ? '#10b981' : '#f59e0b'}
                            stroke="#ffffff"
                            strokeWidth="1.2"
                          />
                          <circle
                            r={2}
                            fill="#ffffff"
                          />
                        </g>
                      )}

                      {/* City Troop Count Badge */}
                      {troopCounts[city.id] !== undefined && (
                        <g transform="translate(6, -2)">
                          <rect
                            x="0"
                            y="0"
                            width="22"
                            height="8"
                            rx="2"
                            fill="#000000"
                            fillOpacity="0.8"
                            stroke="#334155"
                            strokeWidth="0.5"
                          />
                          <text
                            x="11"
                            y="6"
                            textAnchor="middle"
                            fill="#f8fafc"
                            fontSize="5.5"
                            fontWeight="bold"
                            fontFamily="sans-serif"
                          >
                            {(troopCounts[city.id] / 1000).toFixed(1)}k
                          </text>
                        </g>
                      )}

                      {/* City Name Label */}
                      {!city.isFallback && (
                        <text
                          x="0"
                          y={city.isCapital ? -10 : -7}
                          textAnchor="middle"
                          fill="#ffffff"
                          fontSize="9"
                          fontWeight="bold"
                          stroke="#000000"
                          strokeWidth="1.2"
                          style={{ paintOrder: 'stroke fill' }}
                          fontFamily="sans-serif"
                          className="select-none pointer-events-none"
                        >
                          {city.name}
                        </text>
                      )}
                    </g>
                  );
                });
              })}
            </g>
          )}
        </g>
      </svg>

      {/* Floating Hover Tooltip */}
      <AnimatePresence>
        {hoveredCountry && (
          <motion.div
            ref={tooltipRef}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.1 }}
            style={{
              left: Math.min(mousePosRef.current.x + 15, (containerRef.current?.clientWidth || 800) - 220),
              top: Math.max(mousePosRef.current.y - 80, 10),
            }}
            className="absolute z-40 bg-slate-950/95 border border-amber-500/40 p-3 rounded-lg shadow-2xl backdrop-blur-md pointer-events-none w-52 space-y-2 font-cinzel"
          >
            <div className="flex items-center space-x-2.5 border-b border-slate-800 pb-2">
              <div className="w-8 h-5 rounded border border-slate-700 overflow-hidden bg-slate-900 flex-shrink-0">
                <img
                  src={hoveredCountry.flagUrl}
                  alt={hoveredCountry.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="overflow-hidden">
                <h4 className="text-xs font-bold text-slate-100 truncate">{hoveredCountry.name}</h4>
                <p className="text-[10px] text-amber-400 truncate">{hoveredCountry.capital}</p>
              </div>
            </div>

            {(() => {
              const stats = getCountryStats(hoveredCountry);
              return (
                <div className="grid grid-cols-2 gap-1.5 text-[10px] font-sans-body">
                  <div className="flex items-center space-x-1 text-slate-300">
                    <Users className="w-3 h-3 text-cyan-400" />
                    <span className="truncate">{stats.population}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-slate-300">
                    <Swords className="w-3 h-3 text-red-400" />
                    <span className="truncate">{stats.activeMilitary}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-slate-300">
                    <Coins className="w-3 h-3 text-amber-400" />
                    <span className="truncate">{stats.defenseBudget}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-amber-400 font-mono">
                    <Shield className="w-3 h-3 text-emerald-400" />
                    <span className="truncate">{stats.militaryRank}</span>
                  </div>
                </div>
              );
            })()}

            <div className="text-[9px] text-slate-400 text-center pt-1 border-t border-slate-900">
              [Tıkla: Detaylar & Diplomasi]
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
