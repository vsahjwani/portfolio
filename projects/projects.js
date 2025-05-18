import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const colors = d3.scaleOrdinal(d3.schemeTableau10);
const arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
const pieGenerator = d3.pie().value((d) => d.value);
let selectedIndex = -1;

function rollupProjects(projects) {
  return d3.rollups(
    projects,
    (v) => v.length,
    (d) => d.year
  ).map(([year, count]) => ({ label: year, value: count }));
}

function renderPieChart(data) {
  const svg = d3.select('#projects-pie-plot');
  svg.selectAll('*').remove(); // clear existing

  const arcData = pieGenerator(data);
  arcData.forEach((d, i) => {
    svg.append('path')
      .attr('d', arcGenerator(d))
      .attr('fill', colors(i))
      .attr('class', i === selectedIndex ? 'selected' : null)
      .attr('data-index', i);
  });

  const legend = d3.select('.legend');
  legend.selectAll('*').remove(); // clear existing

  data.forEach((d, i) => {
    legend.append('li')
      .attr('style', `--color:${colors(i)}`)
      .attr('class', i === selectedIndex ? 'selected' : null)
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
  });
}

function addPieInteractions(data, projects, container) {
  const svg = d3.select('#projects-pie-plot');
  const legend = d3.select('.legend');

  svg.selectAll('path').on('click', (_, __, idx) => {
    selectedIndex = (selectedIndex === idx) ? -1 : idx;

    svg.selectAll('path')
      .attr('class', (_, i) => (i === selectedIndex ? 'selected' : null));
    legend.selectAll('li')
      .attr('class', (_, i) => (i === selectedIndex ? 'selected' : null));

    const filtered = (selectedIndex === -1)
      ? projects
      : projects.filter(p => p.year === data[selectedIndex].label);

    renderProjects(filtered, container, 'h2');
    renderPieChart(rollupProjects(filtered));
    addPieInteractions(rollupProjects(filtered), projects, container);
  });
}

(async () => {
  try {
    const projects = await fetchJSON('../lib/projects.json');
    const container = document.querySelector('.projects');
    const titleElement = document.querySelector('.projects-title');
    if (titleElement) {
      titleElement.innerHTML += ` (${projects.length})`;
    }

    renderProjects(projects, container, 'h2');
    const pieData = rollupProjects(projects);
    renderPieChart(pieData);
    addPieInteractions(pieData, projects, container);

    // Search integration
    const searchInput = document.querySelector('.searchBar');
    searchInput.addEventListener('input', (event) => {
      const query = event.target.value.trim().toLowerCase();
      let filtered = projects.filter(p =>
        p.title.toLowerCase().includes(query) ||
        (p.description && p.description.toLowerCase().includes(query))
      );

      if (selectedIndex !== -1) {
        const year = pieData[selectedIndex].label;
        filtered = filtered.filter(p => p.year === year);
      }

      renderProjects(filtered, container, 'h2');
      renderPieChart(rollupProjects(filtered));
      addPieInteractions(rollupProjects(filtered), projects, container);
    });

  } catch (error) {
    console.error('Error loading projects:', error);
  }
})();