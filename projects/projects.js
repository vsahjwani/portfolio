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
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
      .style('cursor', 'pointer'); // Make legend items also appear clickable
  });

  return arcData; // Return arcData for use in event handlers
}

function addPieInteractions(data, allProjects, container) {
  const svg = d3.select('#projects-pie-plot');
  const legend = d3.select('.legend');
  const arcData = renderPieChart(data);
  
  // Handle pie slice clicks
  svg.selectAll('path').on('click', function(event) {
    // Get the index from the data-index attribute
    const i = +d3.select(this).attr('data-index');
    
    // Toggle selection
    selectedIndex = selectedIndex === i ? -1 : i;
    
    // Update UI based on selection
    updateSelection(data, allProjects, container);
  });
  
  // Handle legend item clicks
  legend.selectAll('li').each(function(d, i) {
    d3.select(this).on('click', function() {
      // Toggle selection based on index
      selectedIndex = selectedIndex === i ? -1 : i;
      
      // Update UI based on selection
      updateSelection(data, allProjects, container);
    });
  });
}

function updateSelection(data, allProjects, container) {
  const svg = d3.select('#projects-pie-plot');
  const legend = d3.select('.legend');
  
  // Update classes for visual feedback
  svg.selectAll('path')
    .attr('class', function(d, i) {
      return +d3.select(this).attr('data-index') === selectedIndex ? 'selected' : null;
    });
  
  legend.selectAll('li')
    .attr('class', (_, i) => i === selectedIndex ? 'selected' : null);
  
  // Filter projects based on selection
  let filteredProjects;
  if (selectedIndex === -1) {
    filteredProjects = allProjects;
  } else {
    const selectedYear = data[selectedIndex].label;
    filteredProjects = allProjects.filter(p => p.year === selectedYear);
  }
  
  // Render filtered projects
  renderProjects(filteredProjects, container, 'h2');
}

(async () => {
  try {
    const projects = await fetchJSON('../lib/projects.json');
    const container = document.querySelector('.projects');
    const titleElement = document.querySelector('.projects-title');
    if (titleElement) {
      titleElement.innerHTML += ` (${projects.length})`;
    }

    // Initial rendering
    renderProjects(projects, container, 'h2');
    const pieData = rollupProjects(projects);
    
    // Add interactions
    addPieInteractions(pieData, projects, container);

    // Search integration
    const searchInput = document.querySelector('.searchBar');
    if (searchInput) {
      searchInput.addEventListener('input', (event) => {
        const query = event.target.value.trim().toLowerCase();
        
        // First filter by search query
        let filtered = projects.filter(p =>
          p.title.toLowerCase().includes(query) ||
          (p.description && p.description.toLowerCase().includes(query))
        );
        
        // Then apply year filter if necessary
        if (selectedIndex !== -1) {
          const selectedYear = pieData[selectedIndex].label;
          filtered = filtered.filter(p => p.year === selectedYear);
        }
        
        // Render the filtered projects
        renderProjects(filtered, container, 'h2');
        
        // Update the pie chart to reflect the new filtered data
        const newPieData = rollupProjects(filtered);
        renderPieChart(newPieData);
      });
    }
  } catch (error) {
    console.error('Error loading projects:', error);
  }
})();