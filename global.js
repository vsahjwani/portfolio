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
    if (!url.startsWith('http')) {
        // For relative URLs, adjust based on current path depth if local
        if (isLocal) {
            // Get current directory depth
            const pathParts = location.pathname.split('/').filter(Boolean);
            url = pathParts.length > 0 ? '../'.repeat(pathParts.length) + url : url;
        } else {
            // For GitHub Pages
            url = BASE_URL + url;
        }
    }
    
    console.log(`Generated URL for ${p.title}: ${url}`); // Debugging
    
    let title = p.title;
    
    let a = document.createElement('a');
    a.href = url;
    a.textContent = title;
    nav.append(a);

    // Check if this is the current page (local vs production)
    const currentPath = location.pathname.replace(/index\.html$/, '');
    const linkPath = a.pathname.replace(/index\.html$/, '');
    
    if (a.host === location.host && 
        ((isLocal && linkPath === currentPath) || 
         (!isLocal && linkPath === currentPath))) {
        a.classList.add('current');
        console.log(`Current page: ${title}`); // Debugging
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