import * as React from "react";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import Fab from "@mui/material/Fab";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Divider from "@mui/material/Divider";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CloseIcon from "@mui/icons-material/Close";

export default function AICopilotWidget() {
    const [open, setOpen] = React.useState(false);

    return (
        <>
            {!open && (
                <Fab
                    color="primary"
                    aria-label="open ai copilot"
                    onClick={() => setOpen(true)}
                    sx={{
                        position: "fixed",
                        right: 24,
                        bottom: 24,
                        zIndex: (theme) => theme.zIndex.drawer + 2,
                    }}
                >
                    <AutoAwesomeIcon />
                </Fab>
            )}

            <Drawer
                anchor="right"
                open={open}
                onClose={() => setOpen(false)}
                ModalProps={{ keepMounted: true }}
            >
                <Box sx={{ width: { xs: 320, sm: 380 }, height: "100%", display: "flex", flexDirection: "column" }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2, py: 1.5 }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <AutoAwesomeIcon color="primary" fontSize="small" />
                            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                AI Copilot
                            </Typography>
                        </Stack>
                        <IconButton aria-label="close ai copilot" size="small" onClick={() => setOpen(false)}>
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Stack>

                    <Divider />

                    <Box sx={{ flex: 1, p: 2, bgcolor: "#fafbff" }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            (Test)Hello, I'm your AI Copilot. You can ask for analysis suggestions, indicator explanations, or next steps on this page.
                        </Typography>
                    </Box>

                    <Divider />

                    <Stack direction="row" spacing={1} sx={{ p: 2 }}>
                        <TextField
                            size="small"
                            placeholder="Ask AI Copilot..."
                            fullWidth
                        />
                        <Button variant="contained">Send</Button>
                    </Stack>
                </Box>
            </Drawer>
        </>
    );
}