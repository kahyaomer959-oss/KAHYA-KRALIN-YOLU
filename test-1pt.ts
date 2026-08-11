import { Delaunay } from 'd3';
try {
  const delaunay = Delaunay.from([[10, 10]]);
  const voronoi = delaunay.voronoi([0, 0, 20, 20]);
  console.log(voronoi.renderCell(0));
} catch (e) {
  console.error("ERROR:", e);
}
