// src/api/auth.js
import { api, AT, RT } from "./client";

const unwrap = (res) => res.data?.data ?? res.data;

/**
 * 登录
 * payload: { email, password }
 */
export async function login(payload) {
    const data = unwrap(await api.post("/auth/login", payload));
    if (data?.accessToken) AT.set(data.accessToken);
    if (data?.refreshToken) RT.set(data.refreshToken);
    return data;
}

/**
 * 注册
 * payload: RegisterRequest
 */
export async function registerUser(payload) {
    return unwrap(await api.post("/auth/register", payload));
}

/**
 * 刷新令牌
 * 后端签名: @RequestBody String refreshToken
 * 因此 body 必须传“纯字符串”
 */
export async function refreshToken(rawRefreshToken) {
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
