import { fetchJSON, renderProjects, fetchGitHubData } from './global.js';

(async () => {
    
  try {
    const allProjects = await fetchJSON('./lib/projects.json');
    const latestProjects = allProjects.slice(0, 3);
    const container = document.querySelector('.projects');
    renderProjects(latestProjects, container, 'h3');
  } catch (error) {
    console.error('Error loading projects:', error);
  }
  const githubData = await fetchGitHubData('YOUR_GITHUB_USERNAME');
  const profileStats = document.querySelector('#profile-stats');
  
  if (githubData && profileStats) {
    profileStats.innerHTML = `
      <dl>
        <dt>Repos</dt><dd>${githubData.public_repos}</dd>
        <dt>Followers</dt><dd>${githubData.followers}</dd>
        <dt>Following</dt><dd>${githubData.following}</dd>
      </dl>
    `;
  }
})();