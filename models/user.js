// What a user is in this app. The API's shape stops here.
// Every service maps its responses through a model, so pages never see a raw payload.

export function toUser(raw) {
  return {
    id: raw.id ?? null,
    name: raw.name ?? raw.username ?? raw.email,
    email: raw.email,
    token: raw.token ?? null,
  };
}
