import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const colors = d3.scaleOrdinal(d3.schemeTableau10);
const arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
const pieGenerator = d3.pie().value((d) => d.value);

let selectedIndex = -1;
let searchQuery = '';
let pieData = [];

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
      .attr('fill', colors(i));
  });

  const legend = d3.select('.legend');
  legend.selectAll('*').remove(); // clear existing

  data.forEach((d, i) => {
    legend.append('li')
      .attr('style', `--color:${colors(i)}`)
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
  });
}

function applyFilters(projects, container) {
  let filtered = [...projects];

  // Pie chart filter
  if (selectedIndex !== -1) {
    const selectedYear = pieData[selectedIndex].label;
    filtered = filtered.filter(p => p.year === selectedYear);
  }

  // Search filter
  if (searchQuery) {
    filtered = filtered.filter(p =>
      p.title.toLowerCase().includes(searchQuery) ||
      (p.meta && p.meta.toLowerCase().includes(searchQuery))
    );
  }

  // Re-render filtered data
  renderProjects(filtered, container, 'h2');
  const updatedPieData = rollupProjects(filtered);
  renderPieChart(updatedPieData);
  addPieInteractions(updatedPieData, projects, container); // always pass full dataset
}

function addPieInteractions(data, projects, container) {
  const svg = d3.select('#projects-pie-plot');
  const legend = d3.select('.legend');

  svg.selectAll('path').on('click', function (_, d, i) {
    selectedIndex = (selectedIndex === i) ? -1 : i;

    svg.selectAll('path')
      .attr('class', (_, j) => (j === selectedIndex ? 'selected' : null));
    legend.selectAll('li')
      .attr('class', (_, j) => (j === selectedIndex ? 'selected' : null));

    applyFilters(projects, container);
  });
}

(async () => {
  try {
    const projects = await fetchJSON('../lib/projects.json');
    const container = document.querySelector('.projects');

    // Set title text only (no count)
    const titleElement = document.querySelector('.projects-title');
    if (titleElement) {
      titleElement.textContent = 'My Projects';
    }

    // Search box setup
    const searchInput = document.querySelector('.searchBar');
    searchInput.addEventListener('input', (event) => {
      searchQuery = event.target.value.trim().toLowerCase();
      applyFilters(projects, container);
    });

    // Initial rendering
    pieData = rollupProjects(projects);
    renderProjects(projects, container, 'h2');
    renderPieChart(pieData);
    addPieInteractions(pieData, projects, container);

  } catch (error) {
    console.error('Error loading projects:', error);
  }
})();
