import { feature } from 'topojson-client';
import { ISO_NUMERIC_TO_CODE } from '../data/isoMapping';

export interface MapCountryFeature {
  type: 'Feature';
  id: string;
  properties: {
    name: string;
    code: string;
  };
  geometry: any;
}

let cachedFeatures: MapCountryFeature[] | null = null;

export async function loadWorldGeoJson(): Promise<MapCountryFeature[]> {
  if (cachedFeatures) return cachedFeatures;

  try {
    // Try fetching from local static or jsdelivr CDN for high reliability
    const res = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');
    if (!res.ok) throw new Error('Failed to fetch world atlas CDN');
    const topoData = await res.json();
    const geoData = feature(topoData, topoData.objects.countries) as any;

    cachedFeatures = geoData.features.map((feat: any) => {
      const code = ISO_NUMERIC_TO_CODE[String(feat.id).padStart(3, '0')] || 'other';
      return {
        type: 'Feature',
        id: String(feat.id),
        properties: {
          name: feat.properties?.name || 'Bilinmeyen Ülke',
          code: code,
        },
        geometry: feat.geometry,
      };
    });

    return cachedFeatures;
  } catch (err) {
    console.warn('CDN fetch failed, falling back to backup topojson load', err);
    // Dynamic import fallback
    try {
      const topoDataModule: any = await import('world-atlas/countries-110m.json');
      const topoData = topoDataModule.default || topoDataModule;
      const geoData = feature(topoData as any, topoData.objects.countries) as any;
      
      cachedFeatures = geoData.features.map((feat: any) => {
        const code = ISO_NUMERIC_TO_CODE[String(feat.id).padStart(3, '0')] || 'other';
        return {
          type: 'Feature',
          id: String(feat.id),
          properties: {
            name: feat.properties?.name || 'Bilinmeyen Ülke',
            code: code,
          },
          geometry: feat.geometry,
        };
      });

      return cachedFeatures;
    } catch (e) {
      console.error('All map loading strategies failed', e);
      return [];
    }
  }
}
