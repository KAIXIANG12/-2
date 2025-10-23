// src/api/auth.js
import { api, AT, RT } from "./client";

const unwrap = (res) => res.data?.data ?? res.data;

export async function login(payload /* {email,password} */) {
    const data = unwrap(await api.post("/auth/login", payload));
    if (data?.accessToken) AT.set(data.accessToken);
    if (data?.refreshToken) RT.set(data.refreshToken);
    return data;
}

export async function registerUser(payload /* RegisterRequest */) {
    return unwrap(await api.post("/auth/register", payload));
}

export async function refreshToken(rawRefreshToken) {
    // ⚠️ 后端签名是 @RequestBody String refreshToken，因此 body 需为“纯字符串”
    const res = await api.post("/auth/refresh", rawRefreshToken, {
        headers: { "Content-Type": "application/json" },
    });
    const data = unwrap(res);
    if (data?.accessToken) AT.set(data.accessToken);
    if (data?.refreshToken) RT.set(data.refreshToken);
    return data;
}

export async function getMe() {
    return unwrap(await api.get("/auth/me"));
}

export function logout() {
    AT.clear(); RT.clear();
    window.location.replace("/auth/login");
}
