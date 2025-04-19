console.log('IT\'S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

// Step 3: Automatic navigation menu
let pages = [
  { url: '', title: 'Home' },
  { url: 'projects/', title: 'Projects' },
  { url: 'resume/', title: 'Resume' },
  { url: 'contact/', title: 'Contact' },
  { url: "https://github.com/vsahjwani", title: 'Profile' },
];

let nav = document.createElement('nav');
document.body.prepend(nav);

for (let p of pages) {
  let url = p.url;
  const BASE_PATH = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
    ? "/"                  // Local server
    : "/website/";         // GitHub Pages repo name
  
  url = !url.startsWith('http') ? BASE_PATH + url : url;
  let title = p.title;
  
  let a = document.createElement('a');
  a.href = url;
  a.textContent = title;
  nav.append(a);

  // Add "current" class to current page link
  if (a.host === location.host && a.pathname === location.pathname) {
    a.classList.add('current');
  }
  
  // Add target="_blank" for external links
  if (a.host !== location.host) {
    a.target = "_blank";
  }
}

// Step 4: Dark mode switch
// Step 4.2: Adding HTML for the dark mode switch
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