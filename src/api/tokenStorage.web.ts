const TOKEN_KEY = "field_officer_access_token";

export async function storeToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export async function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function readToken() {
  return localStorage.getItem(TOKEN_KEY);
}
