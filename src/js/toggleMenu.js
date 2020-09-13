const menu = document.querySelector('.navbar__menu');
const links = document.querySelector('.navbar__links--mobile');

let open = false;
menu.addEventListener('click', () => {
  if (!open) {
    menu.classList.add('open');
    links.classList.add('open');
    open = true;
  } else {
    menu.classList.remove('open');
    links.classList.remove('open');
    open = false;
  }
});
