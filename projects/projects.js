import { fetchJSON, renderProjects } from '../global.js';

(async () => {
  try {
    const projects = await fetchJSON('../lib/projects.json');
    const container = document.querySelector('.projects');
    renderProjects(projects, container, 'h2');
    
    // Project count
    const titleElement = document.querySelector('.projects-title');
    if (titleElement) {
      titleElement.innerHTML += ` (${projects.length})`;
    }
  } catch (error) {
    console.error('Error loading projects:', error);
  }
})();