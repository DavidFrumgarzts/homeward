// Locks a check-in answer so only the person who asked can read it. Built into every browser (WebCrypto):
// the asker's browser makes a key pair and sends only the public half with the question; the traveler's
// browser locks the answer with it (ECDH P-256 -> AES-GCM 256). The server only ever holds the locked text.
const subtle = globalThis.crypto.subtle;
const EC = { name: "ECDH", namedCurve: "P-256" };
const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

// A new key pair, both halves as JWK (the private half stays in the asker's browser).
export async function makeKeys() {
  const pair = await subtle.generateKey(EC, true, ["deriveKey"]);
  return { publicJwk: await subtle.exportKey("jwk", pair.publicKey), privateJwk: await subtle.exportKey("jwk", pair.privateKey) };
}

async function aesKey(privateKey, publicKey, use) {
  return subtle.deriveKey({ name: "ECDH", public: publicKey }, privateKey, { name: "AES-GCM", length: 256 }, false, [use]);
}

// -> {epk, iv, data}: a one-time public key, the nonce and the locked text (base64).
export async function seal(publicJwk, text) {
  const theirs = await subtle.importKey("jwk", publicJwk, EC, false, []);
  const mine = await subtle.generateKey(EC, true, ["deriveKey"]);
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const data = await subtle.encrypt({ name: "AES-GCM", iv }, await aesKey(mine.privateKey, theirs, "encrypt"), new TextEncoder().encode(text));
  return { epk: await subtle.exportKey("jwk", mine.publicKey), iv: b64(iv), data: b64(data) };
}

// Throws if the answer wasn't locked for this key.
export async function unseal(privateJwk, { epk, iv, data }) {
  const mine = await subtle.importKey("jwk", privateJwk, EC, false, ["deriveKey"]);
  const theirs = await subtle.importKey("jwk", epk, EC, false, []);
  const plain = await subtle.decrypt({ name: "AES-GCM", iv: unb64(iv) }, await aesKey(mine, theirs, "decrypt"), unb64(data));
  return new TextDecoder().decode(plain);
}
