import * as d3Geo from 'd3-geo';
import { loadWorldGeoJson } from './src/utils/mapLoader';

async function main() {
  const feats = await loadWorldGeoJson();
  const tr = feats.find(f => f.properties.code.toLowerCase() === 'tr');
  const projection = d3Geo.geoMercator().scale(130).translate([800 / 2, 600 / 2]);
  const pathGen = d3Geo.geoPath().projection(projection);
  if (tr) {
    console.log("TR Area:", pathGen.area(tr));
  } else {
    console.log("TR not found");
  }
}
main();
