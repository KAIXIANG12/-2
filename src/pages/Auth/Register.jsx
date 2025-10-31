import * as React from "react";
import {
    Box, Paper, TextField, Button, Typography, Stack, Link, Alert, Divider,
    InputAdornment, IconButton
} from "@mui/material";
import { useForm } from "react-hook-form";
import { NavLink, useNavigate } from "react-router-dom";
import { Visibility, VisibilityOff, PersonOutline, EmailOutlined, LockOutlined } from "@mui/icons-material";

export default function Register() {
    const navigate = useNavigate();
    const [errorText, setErrorText] = React.useState("");
    const [showPassword, setShowPassword] = React.useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors, isSubmitting },
    } = useForm({
        mode: "onBlur",
        defaultValues: {
            firstName: "",
            lastName: "",
            email: "",
            password: "",
            confirmPassword: "",
        },
    });

    const API_BASE = import.meta.env?.VITE_API_BASE || "";
    const REGISTER_URL = `${API_BASE}/api/auth/register`;

    const onSubmit = async (v) => {
        setErrorText("");
        const payload = {
            firstName: v.firstName,
            lastName: v.lastName,
            email: v.email,
            password: v.password,
            confirmPassword: v.confirmPassword,
            authProvider: "local",
            externalId: null,
            tenantId: null,
        };

        try {
            const res = await fetch(REGISTER_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error(await res.text());
            alert("Registration successful! Please log in.");
            navigate("/auth/login", { replace: true });
        } catch (e) {
            setErrorText("Registration failed: " + (e.message || "Unknown error"));
        }
    };

    return (
        <Box
            sx={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#ffffff", // ✅ 白色背景
                p: 2
            }}
        >
            <Paper
                elevation={8}
                sx={{
                    p: { xs: 3, sm: 5 },
                    width: "100%",
                    maxWidth: 560,
                    borderRadius: 3,
                    border: "1px solid #e6e6e6",
                    boxShadow: "0 6px 26px rgba(0,0,0,0.08)"
                }}
            >
                {/* ✅ StrategicALLY Logo */}
                <Box sx={{ textAlign: "center", mb: 4 }}>
                    <Typography
                        variant="h3"
                        sx={{
                            fontWeight: 800,
                            color: "#1a1a1a",
                            letterSpacing: "1px",
                            fontFamily: "Poppins, sans-serif"
                        }}
                    >
                        Strategic
                        <span style={{ color: "#667eea" }}>ALLY</span>
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                        Create your account to start your strategic journey
                    </Typography>
                </Box>

                {errorText && (
                    <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                        {errorText}
                    </Alert>
                )}

                <Stack spacing={2.5} component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
                    <Stack direction="row" spacing={2}>
                        <TextField
                            label="First Name"
                            fullWidth
                            {...register("firstName", { required: "First name is required" })}
                            error={!!errors.firstName}
                            helperText={errors.firstName?.message}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <PersonOutline fontSize="small" />
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <TextField
                            label="Last Name"
                            fullWidth
                            {...register("lastName", { required: "Last name is required" })}
                            error={!!errors.lastName}
                            helperText={errors.lastName?.message}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <PersonOutline fontSize="small" />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Stack>

                    <TextField
                        label="Email Address"
                        fullWidth
                        type="email"
                        {...register("email", {
                            required: "Email is required",
                            pattern: { value: /^[^@\s]+@[^@\s]+\.[^@\s]+$/, message: "Please enter a valid email address" },
                        })}
                        error={!!errors.email}
                        helperText={errors.email?.message}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <EmailOutlined fontSize="small" />
                                </InputAdornment>
                            ),
                        }}
                    />

                    <TextField
                        label="Password"
                        fullWidth
                        type={showPassword ? "text" : "password"}
                        {...register("password", {
                            required: "Password is required",
                            minLength: { value: 6, message: "Password must be at least 6 characters" },
                        })}
                        error={!!errors.password}
                        helperText={errors.password?.message}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <LockOutlined fontSize="small" />
                                </InputAdornment>
                            ),
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton size="small" onClick={() => setShowPassword(!showPassword)}>
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />

                    <TextField
                        label="Confirm Password"
                        fullWidth
                        type={showConfirmPassword ? "text" : "password"}
                        {...register("confirmPassword", {
                            validate: (v) => v === watch("password") || "Passwords do not match",
                        })}
                        error={!!errors.confirmPassword}
                        helperText={errors.confirmPassword?.message}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <LockOutlined fontSize="small" />
                                </InputAdornment>
                            ),
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton size="small" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />

                    <Button
                        type="submit"
                        variant="contained"
                        disabled={isSubmitting}
                        size="large"
                        sx={{
                            py: 1.5,
                            mt: 1,
                            borderRadius: 2,
                            textTransform: "none",
                            fontSize: "1rem",
                            fontWeight: 600,
                            bgcolor: "#667eea",
                            boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)",
                            "&:hover": { bgcolor: "#5568d3" }
                        }}
                    >
                        {isSubmitting ? "Creating Account..." : "Create Account"}
                    </Button>
                </Stack>

                <Divider sx={{ my: 3 }} />

                <Typography variant="body2" textAlign="center">
                    Already have an account?{" "}
                    <Link component={NavLink} to="/auth/login" underline="hover" sx={{ color: "#667eea", fontWeight: 600 }}>
                        Sign in here
                    </Link>
                </Typography>
            </Paper>
        </Box>
    );
}
