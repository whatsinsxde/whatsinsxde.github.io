document.documentElement.classList.add('js');
try {
  if (!sessionStorage.getItem('booted') && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.classList.add('booting');
  }
} catch (e) {}
