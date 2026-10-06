// Vite tarzı uzantısız importları Node'da çözmek için küçük bir resolve hook'u
import { register } from 'node:module';

register(
  'data:text/javascript,' +
    encodeURIComponent(`export async function resolve(s, c, n) {
      try { return await n(s, c); }
      catch (e) { if (s.startsWith('.') && !s.endsWith('.js')) return n(s + '.js', c); throw e; }
    }`),
  import.meta.url
);
