// src/api/client.js
import axios from "axios";

/**
 * ✅ 后端同学本地测试说明：
 * - 默认 BASE_URL = "http://localhost:8080"
 * - 如果你有 .env：VITE_API_BASE_URL=http://localhost:8080
 */
export const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

/**
 * ✅ axios 实例
 * 所有 /auth/* 请求都会自动拼到 http://localhost:8080/
 */
const api = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
});

/**
 * ✅ Token 存储方案（轻量 MVP）
 * Access Token  → sessionStorage
 * Refresh Token → localStorage
 */
const AT = {
    get: () => sessionStorage.getItem("access_token"),
    set: (v) => sessionStorage.setItem("access_token", v),
    clear: () => sessionStorage.removeItem("access_token")
};

const RT = {
    get: () => localStorage.getItem("refresh_token"),
    set: (v) => localStorage.setItem("refresh_token", v),
    clear: () => localStorage.removeItem("refresh_token")
};

/**
 * ✅ 请求拦截器：自动附带 Bearer Token
 */
api.interceptors.request.use((cfg) => {
    const token = AT.get();
    if (token) cfg.headers.Authorization = `Bearer ${token}`;
    return cfg;
});

/**
 * ✅ 响应拦截器：401 自动刷新
 * Spring Boot 那边 @RequestBody String refreshToken → body 必须是纯字符串
 */
let refreshing = null;

api.interceptors.response.use(
    (res) => res,
    async (err) => {
        const { response, config } = err || {};

        // 没有响应 / 不是 401 / 该请求已重试过 → 直接抛出
        if (!response || response.status !== 401 || config.__retried) throw err;

        try {
            if (!refreshing) {
                const rt = RT.get();
                if (!rt) throw err;

                // ✅ 必须用绝对地址，不走默认 baseURL，避免路径被干扰
                refreshing = axios.post(`${BASE_URL}/auth/refresh`, rt, {
                    headers: { "Content-Type": "application/json" },
                    timeout: 15000
                });
            }

            const result = await refreshing;
            refreshing = null;

            const data = result.data?.data ?? result.data;

            // ✅ 刷新后写回 Token
            if (data?.accessToken) AT.set(data.accessToken);
            if (data?.refreshToken) RT.set(data.refreshToken);

            // ✅ 重发原请求
            config.__retried = true;
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${data.accessToken}`;
            return api(config);
        } catch (e) {
            // ✅ 刷新失败 → 清空登录状态 → 返回登录页
            refreshing = null;
            AT.clear();
            RT.clear();
            window.location.replace("/auth/login");
            throw err;
        }
    }
);

export { api, AT, RT };
