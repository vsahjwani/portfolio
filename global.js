console.log('IT\'S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

// Define base URLs for local vs. production
const isLocal = location.hostname === "localhost" || location.hostname === "127.0.0.1";
const BASE_URL = isLocal ? "/" : "/portfolio/";

// Define page paths (relative to the base URL)
let pages = [
    { url: '', title: 'Home' },
    { url: 'projects/', title: 'Projects' },
    { url: 'resume/', title: 'Resume' },
    { url: 'contact/', title: 'Contact' },
    { url: "https://github.com/vsahjwani", title: 'Profile' },
];

// Create navigation
let nav = document.createElement('nav');
document.body.prepend(nav);

for (let p of pages) {
  let url = p.url;
  // Generate the full URL based on environment
  if (!p.url.startsWith('http')) {
      if (isLocal) {
          url = p.url; // Use relative paths locally
      } else {
          url = '/portfolio/' + p.url; // Use root-relative paths in production
      }
  }
  
  let a = document.createElement('a');
  a.href = url;
  a.textContent = p.title;
  nav.append(a);

  // Current page check remains the same
  if (a.host === location.host && a.pathname === location.pathname) {
      a.classList.add('current');
  }
  
  if (a.host !== location.host) {
      a.target = "_blank";
  }
}

document.body.insertAdjacentHTML(
  'afterbegin',
  `
  <label class="color-scheme">
    Theme:
    <select>
      <option value="light dark">Automatic</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  </label>
  `
);

// Step 4.4: Making the dark mode switch work
const select = document.querySelector('.color-scheme select');

// Function to set color scheme
function setColorScheme(colorScheme) {
  document.documentElement.style.setProperty('color-scheme', colorScheme);
  select.value = colorScheme;
}

// Step 4.5: Load saved preference from localStorage if it exists
if ("colorScheme" in localStorage) {
  setColorScheme(localStorage.colorScheme);
}

// Listen for changes to the select element
select.addEventListener('input', function(event) {
  const newColorScheme = event.target.value;
  setColorScheme(newColorScheme);
  localStorage.colorScheme = newColorScheme;
});

// Step 5: Better contact form (Optional)
const contactForm = document.querySelector('form[action^="mailto:"]');

contactForm?.addEventListener('submit', function(event) {
  event.preventDefault();
  
  const data = new FormData(contactForm);
  let url = contactForm.action + "?";
  let params = [];
  
  for (let [name, value] of data) {
    params.push(name + "=" + encodeURIComponent(value));
  }
  
  url += params.join("&");
  location.href = url;
});

export async function fetchJSON(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);
    return await response.json();
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
}

export function renderProjects(projects, container, headingLevel = 'h2') {
  if (!container) return;
  container.innerHTML = '';
  
  projects.forEach(project => {
    const article = document.createElement('article');
    article.innerHTML = `
      <${headingLevel}>${project.title}</${headingLevel}>
      <img src="${project.image}" alt="${project.title}">
      <div>
      <p> ${project.description} <\p>
      <p. <i${project.year}> </p>
      <\div>
    `;
    container.appendChild(article);
  });
}

export async function fetchGitHubData(username) {
  try {
    const response = await fetch(`https://api.github.com/users/${username}`);
    if (!response.ok) throw new Error(`GitHub error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('GitHub API Error:', error);
    return null;
  }
}