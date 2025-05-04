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

let data = [1, 2, 3, 4, 5, 5];
let colors = d3.scaleOrdinal(d3.schemeTableau10);
let sliceGenerator = d3.pie();
let arcData = sliceGenerator(data);
let arcs = arcData.map((d) => arcGenerator(d));

arcs.forEach((arc, idx) => {
  d3.select('svg')
    .append('path')
    .attr('d', arc)
    .attr('fill',colors(idx))
})