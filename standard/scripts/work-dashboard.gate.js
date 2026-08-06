/* The password gate for a locked build. Everything the reader came for is in the ciphertext
   below; this script is the only thing that runs until the password decrypts it. */

const SALT = '__SALT__'
const IV = '__IV__'
const ROUNDS = __ROUNDS__
const KEEP = 'work-dashboard:pw'

const form = document.getElementById('gate')
const field = document.getElementById('pw')
const error = document.getElementById('err')
const button = form.querySelector('button')

const bytes = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))

async function open(password) {
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey'])
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: bytes(SALT), iterations: ROUNDS, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt'],
  )
  // A wrong password fails the authentication tag here and throws. There is no branch that
  // shows part of the page to somebody who did not have the password.
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: bytes(IV) },
    key,
    bytes(document.getElementById('payload').textContent.trim()),
  )
  return new TextDecoder().decode(plain)
}

// document.write replaces the whole document *and runs its scripts*, which innerHTML does
// not, and keeps the URL - so the page that appears can still read its own state.json.
function show(html) {
  document.open()
  document.write(html)
  document.close()
}

async function attempt(password, remember) {
  button.disabled = true
  button.textContent = 'Opening…'
  try {
    const html = await open(password)
    // Kept for this tab only, so the page can refresh itself when the work moves without
    // asking again. Closing the tab forgets it; nothing is written to disk.
    if (remember) sessionStorage.setItem(KEEP, password)
    show(html)
  } catch {
    sessionStorage.removeItem(KEEP)
    error.hidden = false
    field.value = ''
    field.focus()
    button.disabled = false
    button.textContent = 'Open'
  }
}

form.addEventListener('submit', (e) => {
  e.preventDefault()
  error.hidden = true
  if (field.value) attempt(field.value, true)
})

const kept = sessionStorage.getItem(KEEP)
if (kept) attempt(kept, false)
