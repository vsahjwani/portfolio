console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

let pages = [
    { url: '', title: 'Home' },
    { url: 'projects/', title: 'Projects' },
    { url: 'resume/', title: 'Resume' },
    { url: 'contact/', title: 'Contact' },
    { url: "https://github.com/vsahjwani", title: 'Git Profile' },
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
  }
  
  nav.insertAdjacentHTML('beforeend', `<a href="${url}">${title}</a>`);

  