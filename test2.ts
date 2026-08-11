import { Delaunay } from 'd3';
const delaunay = Delaunay.from([[10, 10], [20, 20]]);
const voronoi = delaunay.voronoi([0, 0, 30, 30]);
console.log(voronoi.renderCell(0));
