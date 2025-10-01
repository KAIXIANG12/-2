// src/pages/Auth/Login.jsx
import * as React from "react";
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Divider,
    Stack,
    Link
} from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";

export default function Login() {
    const [email, setEmail] = React.useState("");
    const [loading, setLoading] = React.useState(false);

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        if (!email) return;
        setLoading(true);
        // TODO: 调用你们后端/第三方鉴权（如 Supabase/Auth0/Firebase）
        // await auth.signInWithOtp({ email })
        setTimeout(() => setLoading(false), 800); // demo
    };

    const handleGoogle = async () => {
        // TODO: 调用 Google OAuth 流程
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
                            color: "#9b8bb5", // 淡紫
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
                                bgcolor: "#8B0036", // 酒红
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
                        Create an account
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                        Enter your email to sign up for this app
                    </Typography>
                </Box>

                {/* Email 表单 */}
                <Box component="form" onSubmit={handleEmailSubmit} noValidate>
                    <TextField
                        fullWidth
                        type="email"
                        placeholder="email@domain.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        inputProps={{ "aria-label": "email" }}
                        sx={{
                            mb: 1.5,
                            "& .MuiOutlinedInput-root": {
                                borderRadius: 1.5,
                            },
                        }}
                    />

                    <Button
                        fullWidth
                        type="submit"
                        variant="contained"
                        disabled={!email || loading}
                        sx={{
                            textTransform: "none",
                            py: 1.25,
                            borderRadius: 1.5,
                            bgcolor: "#000",
                            "&:hover": { bgcolor: "#111" },
                        }}
                    >
                        {loading ? "Sending..." : "Sign up with email"}
                    </Button>
                </Box>

                {/* 分隔线 */}
                <Stack
                    direction="row"
                    alignItems="center"
                    spacing={2}
                    sx={{ my: 2.5 }}
                >
                    <Divider sx={{ flex: 1 }} />
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                        or continue with
                    </Typography>
                    <Divider sx={{ flex: 1 }} />
                </Stack>

                {/* Google 按钮 */}
                <Button
                    fullWidth
                    variant="outlined"
                    onClick={handleGoogle}
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
                    Google
                </Button>

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
