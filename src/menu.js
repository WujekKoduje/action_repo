/* Mobile slide-in menu drawer. Shared by both pages.
   Markup contract:
     <button data-menu-open>       — opens
     <div id="menu" data-open="false">
       <div data-menu-close></div>  — overlay, closes
       <button data-menu-close>×</button>
       <a href="#..." data-menu-link>…</a>  — closes after navigating
*/

export function initMenu() {
  const menu = document.getElementById('menu');
  if (!menu) return;

  const setOpen = (open) => {
    menu.dataset.open = open ? 'true' : 'false';
    document.body.style.overflow = open ? 'hidden' : '';
  };

  document.querySelectorAll('[data-menu-open]').forEach((el) =>
    el.addEventListener('click', () => setOpen(true))
  );
  menu.querySelectorAll('[data-menu-close]').forEach((el) =>
    el.addEventListener('click', () => setOpen(false))
  );
  menu.querySelectorAll('[data-menu-link]').forEach((el) =>
    el.addEventListener('click', () => setOpen(false))
  );
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.dataset.open === 'true') setOpen(false);
  });

  return { close: () => setOpen(false) };
}
