/**
 * Simple in-process mutex to prevent concurrent CSV writes.
 * For multi-process / production use, replace with a file-lock library.
 */
const locks = {};

export async function withLock(key, fn) {
  while (locks[key]) {
    await new Promise((r) => setTimeout(r, 20));
  }
  locks[key] = true;
  try {
    return await fn();
  } finally {
    locks[key] = false;
  }
}
