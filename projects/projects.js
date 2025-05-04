import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

(async () => {
  try {
    const projects = await fetchJSON('../lib/projects.json');
    const container = document.querySelector('.projects');
    renderProjects(projects, container, 'h2');
    
    const titleElement = document.querySelector('.projects-title');
    if (titleElement) {
      titleElement.innerHTML += ` (${projects.length})`;
    }
  } catch (error) {
    console.error('Error loading projects:', error);
  }
})();

let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
let arc = arcGenerator({
  startAngle: 0,
  endAngle: 2 * Math.PI,
});

let data = [1, 2];
let total = 0;

for (let d of data) {
  total += d;
}

let angle = 0;
let arcData = [];

for (let d of data) {
  let endAngle = angle + (d / total) * 2 * Math.PI;
  arcData.push({ startAngle: angle, endAngle });
  angle = endAngle;
}

let arcs = arcData.map((d) => arcGenerator(d));

arcs.forEach((arc) => {
  d3.select('svg').append('path').attr('d', arc).attr('fill', 'red');
});

let colors = ['gold', 'purple'];
arcs.forEach((arc, idx) => {
  d3.select('svg')
    .append('path')
    .attr('d', arc)
    .attr('fill',colors[idx])
})