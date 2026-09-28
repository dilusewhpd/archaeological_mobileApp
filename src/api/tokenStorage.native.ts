import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "field_officer_access_token";

export function storeToken(token: string) {
  return SecureStore.setItemAsync(TOKEN_KEY, token);
}

export function clearToken() {
  return SecureStore.deleteItemAsync(TOKEN_KEY);
}

export function readToken() {
  return SecureStore.getItemAsync(TOKEN_KEY);
}
