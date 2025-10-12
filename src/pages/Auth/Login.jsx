// src/pages/Auth/Login.jsx
import * as React from "react";
import {
    Box,
    Paper,
    Typography,
    Button,
    Divider,
    Stack,
    Link,
    TextField,
    IconButton,
    InputAdornment,
} from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";
import LockOpenRoundedIcon from "@mui/icons-material/LockOpenRounded";
import BusinessRoundedIcon from "@mui/icons-material/BusinessRounded";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { useForm } from "react-hook-form";

export default function Login() {
    const [loadingSSO, setLoadingSSO] = React.useState(false);
    const [loadingGoogle, setLoadingGoogle] = React.useState(false);
    const [showPwd, setShowPwd] = React.useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({
        mode: "onBlur",
        reValidateMode: "onChange",
        defaultValues: { email: "", password: "" },
    });

    // Email + Password 登录（前端示例）
    const onEmailPasswordLogin = async (values) => {
        await new Promise((r) => setTimeout(r, 900)); // demo
        alert(`Email/Password login (demo): ${values.email}`);
    };

    // 企业 SSO（OIDC / SAML）
    const handleSSO = async () => {
        try {
            setLoadingSSO(true);
            // window.location.href = `/auth/sso/redirect`; // 接后端时替换
            await new Promise((r) => setTimeout(r, 900)); // demo
            alert("Redirecting to your organization's SSO provider…");
        } finally {
            setLoadingSSO(false);
        }
    };

    // Google SSO
    const handleGoogle = async () => {
        try {
            setLoadingGoogle(true);
            // window.location.href = `/auth/google`; // 接后端时替换
            await new Promise((r) => setTimeout(r, 900)); // demo
            alert("Redirecting to Google SSO…");
        } finally {
            setLoadingGoogle(false);
        }
    };

    return (
        <Box
            sx={{
                minHeight: "100vh",
                bgcolor: "#ffffff",
                display: "grid",
                placeItems: "center",
                p: 2,
            }}
        >
            <Paper
                elevation={0}
                sx={{
                    width: "100%",
                    maxWidth: 520,
                    p: { xs: 2.5, md: 4 },
                    boxShadow: "none",
                    bgcolor: "transparent",
                }}
            >
                {/* Logo */}
                <Box sx={{ textAlign: "center", mb: 3 }}>
                    <Typography
                        aria-label="StrategicALLY"
                        sx={{
                            fontSize: 44,
                            fontWeight: 800,
                            letterSpacing: 1,
                            color: "#9b8bb5",
                            userSelect: "none",
                        }}
                    >
                        Strategic
                        <Box
                            component="span"
                            sx={{
                                ml: 1,
                                px: 1,
                                py: "2px",
                                borderRadius: "6px",
                                bgcolor: "#8B0036",
                                color: "#fff",
                                fontWeight: 900,
                            }}
                        >
                            ALLY
                        </Box>
                    </Typography>
                </Box>

                {/* 标题 & 副标题 */}
                <Box sx={{ textAlign: "center", mb: 2 }}>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        Sign in to your account
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                        Sign in with email & password or continue with SSO.
                    </Typography>
                </Box>

                {/* --- 区块 1：Email + Password（置顶） --- */}
                <Box
                    component="form"
                    onSubmit={handleSubmit(onEmailPasswordLogin)}
                    noValidate
                    sx={{ mt: 0.5 }}
                >
                    <TextField
                        fullWidth
                        type="email"
                        placeholder="email@domain.com"
                        autoComplete="email"
                        inputProps={{ "aria-label": "email" }}
                        {...register("email", {
                            required: "Email is required",
                            pattern: {
                                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                message: "Enter a valid email",
                            },
                        })}
                        error={Boolean(errors.email)}
                        helperText={errors.email?.message}
                        sx={{
                            mb: 1.5,
                            "& .MuiOutlinedInput-root": { borderRadius: 1.5 },
                        }}
                    />

                    <TextField
                        fullWidth
                        type={showPwd ? "text" : "password"}
                        placeholder="Password"
                        autoComplete="current-password"
                        inputProps={{ "aria-label": "password" }}
                        {...register("password", {
                            required: "Password is required",
                            minLength: { value: 6, message: "At least 6 characters" },
                        })}
                        error={Boolean(errors.password)}
                        helperText={errors.password?.message}
                        sx={{
                            mb: 1.5,
                            "& .MuiOutlinedInput-root": { borderRadius: 1.5 },
                        }}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        aria-label="toggle password visibility"
                                        onClick={() => setShowPwd((v) => !v)}
                                        edge="end"
                                    >
                                        {showPwd ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />

                    <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        sx={{ mb: 1.25 }}
                    >
                        <span />
                        <Link
                            underline="hover"
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                alert("Forgot password (demo)");
                            }}
                            sx={{ fontSize: 13 }}
                        >
                            Forgot password?
                        </Link>
                    </Stack>

                    <Button
                        fullWidth
                        type="submit"
                        variant="contained"
                        disabled={isSubmitting || loadingSSO || loadingGoogle}
                        sx={{
                            textTransform: "none",
                            py: 1.25,
                            borderRadius: 1.5,
                            bgcolor: "#000",
                            "&:hover": { bgcolor: "#111" },
                        }}
                    >
                        {isSubmitting ? "Signing in…" : "Sign in with email"}
                    </Button>
                </Box>

                {/* --- 分割线：下方为 SSO 选项 --- */}
                <Stack direction="row" alignItems="center" spacing={2} sx={{ my: 2.5 }}>
                    <Divider sx={{ flex: 1 }} />
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                        or continue with
                    </Typography>
                    <Divider sx={{ flex: 1 }} />
                </Stack>

                {/* --- 区块 2：SSO / Google --- */}
                <Stack spacing={1.25}>
                    <Button
                        fullWidth
                        variant="contained"
                        onClick={handleSSO}
                        disabled={loadingSSO || loadingGoogle}
                        startIcon={
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                                <BusinessRoundedIcon sx={{ mr: 0.25 }} />
                                <LockOpenRoundedIcon fontSize="small" />
                            </Box>
                        }
                        sx={{
                            textTransform: "none",
                            py: 1.25,
                            borderRadius: 1.5,
                            bgcolor: "#000",
                            "&:hover": { bgcolor: "#111" },
                        }}
                    >
                        {loadingSSO ? "Connecting to SSO…" : "Continue with SSO"}
                    </Button>

                    <Button
                        fullWidth
                        variant="outlined"
                        onClick={handleGoogle}
                        disabled={loadingSSO || loadingGoogle}
                        startIcon={<GoogleIcon />}
                        sx={{
                            textTransform: "none",
                            py: 1.1,
                            borderRadius: 1.5,
                            borderColor: "#e0e0e0",
                            bgcolor: "#fff",
                            "&:hover": { borderColor: "#cfcfcf", bgcolor: "#fff" },
                        }}
                    >
                        {loadingGoogle ? "Connecting…" : "Continue with Google"}
                    </Button>
                </Stack>

                {/* Terms & Privacy */}
                <Typography
                    variant="caption"
                    sx={{
                        display: "block",
                        textAlign: "center",
                        color: "text.secondary",
                        mt: 2.5,
                    }}
                >
                    By clicking continue, you agree to our{" "}
                    <Link underline="hover" href="#" sx={{ color: "text.primary" }}>
                        Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link underline="hover" href="#" sx={{ color: "text.primary" }}>
                        Privacy Policy
                    </Link>
                </Typography>
            </Paper>
        </Box>
    );
}
