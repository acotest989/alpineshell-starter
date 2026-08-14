import { http } from 'alpineshell';
import { sleep } from '../mock/latency.js';
import { toUser } from '../models/user.js';

export const AUTH_KEY = 'auth';

// Stands in for a real endpoint: the lookup a server would do against its users table.
// A real API never ships passwords to the browser — that is why toUser() drops the field.
export async function login({ email, password }) {
  const [users] = await Promise.all([http.get('/mock/users.json'), sleep()]);

  const match = users.find(
    (user) => user.email === email.trim().toLowerCase() && user.password === password
  );

  if (!match) throw new Error('Wrong email or password.');

  return toUser({ ...match, token: 'mock-token' });
}
