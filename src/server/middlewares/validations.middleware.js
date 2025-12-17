export const validateCredentials = (req, res, next) => {
    const { email = "", password = "" } = req.body;
    const invalidEmail =
        !email.trim() ||
        /\s/.test(email) ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const invalidPassword =
        !password.trim() ||
        /\s/.test(password) ||
        password.length < 8 ||
        password.length > 78;

    if (invalidEmail || invalidPassword) {
        return res
            .status(400)
            .json({ bad_credentials: "(❌) Correo o contraseña inválidos." });
    }
    next();
}