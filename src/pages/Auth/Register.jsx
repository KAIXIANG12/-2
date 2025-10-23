import * as React from "react";
import { Box, Paper, TextField, Button, Typography, Stack, Link, Alert } from "@mui/material";
import { useForm } from "react-hook-form";
import { NavLink, useNavigate } from "react-router-dom";

export default function Register() {
    const navigate = useNavigate();
    const [errorText, setErrorText] = React.useState("");
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
        <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", bgcolor: "#fff", p: 2 }}>
            <Paper sx={{ p: 4, width: "100%", maxWidth: 520 }}>
                <Typography variant="h5" sx={{ mb: 1, fontWeight: 700 }}>
                    Create your account
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                    Already have an account?{" "}
                    <Link component={NavLink} to="/auth/login" underline="hover">
                        Sign in
                    </Link>
                </Typography>

                {errorText && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {errorText}
                    </Alert>
                )}

                <Stack spacing={1.25} component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
                    <Stack direction="row" spacing={1.25}>
                        <TextField
                            label="First Name"
                            fullWidth
                            {...register("firstName", { required: "Required" })}
                            error={!!errors.firstName}
                            helperText={errors.firstName?.message}
                        />
                        <TextField
                            label="Last Name"
                            fullWidth
                            {...register("lastName", { required: "Required" })}
                            error={!!errors.lastName}
                            helperText={errors.lastName?.message}
                        />
                    </Stack>

                    <TextField
                        label="Email"
                        fullWidth
                        type="email"
                        {...register("email", {
                            required: "Required",
                            pattern: { value: /^[^@\s]+@[^@\s]+\.[^@\s]+$/, message: "Invalid email" },
                        })}
                        error={!!errors.email}
                        helperText={errors.email?.message}
                    />

                    <TextField
                        label="Password"
                        fullWidth
                        type="password"
                        {...register("password", {
                            required: "Required",
                            minLength: { value: 6, message: "At least 6 characters" },
                        })}
                        error={!!errors.password}
                        helperText={errors.password?.message}
                    />

                    <TextField
                        label="Confirm Password"
                        fullWidth
                        type="password"
                        {...register("confirmPassword", {
                            validate: (v) => v === watch("password") || "Passwords do not match",
                        })}
                        error={!!errors.confirmPassword}
                        helperText={errors.confirmPassword?.message}
                    />

                    <Button
                        type="submit"
                        variant="contained"
                        disabled={isSubmitting}
                        sx={{ py: 1.25, mt: 1.5, bgcolor: "#000", "&:hover": { bgcolor: "#111" } }}
                    >
                        {isSubmitting ? "Creating..." : "Create account"}
                    </Button>
                </Stack>
            </Paper>
        </Box>
    );
}
