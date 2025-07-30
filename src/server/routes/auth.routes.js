import { findUserByEmail, getProfile, register, login, logout } from "#controllers/auth.controller";
import { checkAuth, userOnly, adminOnly } from "#middlewares/authorizations.middleware";
import { validateCredentials } from "#middlewares/validations.middleware";

import express from "express";

const router = express.Router();

// MÉTODO GET
router.get('/me', checkAuth, userOnly, getProfile)

// MÉTODO POST
router.post('/register', validateCredentials, register);
router.post('/login', validateCredentials, login);
router.post('/logout', checkAuth, userOnly, logout);

router.post('/find-user', findUserByEmail);

export const authRoutes = router;