import { createAuthClient } from './auth-client.js';
import { createLibraryClient } from './library-client.js';
let storage;
try { storage = globalThis.sessionStorage; } catch { /* Sesión en memoria. */ }
const client = createAuthClient({ baseUrl: import.meta.env.VITE_API_URL || '/api/v1', storage, onExpired: () => window.dispatchEvent(new Event('chokxen:session-expired')) });
export const libraryClient = createLibraryClient(client.authorized);
export const login = client.login;
export const register = values => client.register({ ...values, plan: 'Basico' });
export const restoreSession = client.restore;
export const logout = client.logout;
