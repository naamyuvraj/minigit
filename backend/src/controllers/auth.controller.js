import passport from "passport";
import jwt from "jsonwebtoken";

// Auth controller class
class AuthController {
  // Handle google login
  googleAuth(req, res, next) {
    passport.authenticate("google", { scope: ["profile", "email"] })(req, res, next);
  }

  // Google callback handler
  googleCallback(req, res, next) {
    const frontendUrl = process.env.FRONTEND_URL || "https://openbox-dev4ce.vercel.app";

    passport.authenticate("google", { failureRedirect: `${frontendUrl}/login` }, (err, user) => {
      if (err || !user) {
        return res.redirect(`${frontendUrl}/login?error=auth_failed`);
      }
      
      // Generate the JWT token that the frontend requires
      const token = jwt.sign(
        { id: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      // Redirect to the frontend OAuth page so it can save the token
      return res.redirect(`${frontendUrl}/oauth?token=${token}`);
    })(req, res, next);
  }

  // Logout the user
  logout(req, res) {
    const frontendUrl = process.env.FRONTEND_URL || "https://openbox-dev4ce.vercel.app";
    req.logout((err) => {
      if (err) return next(err);
      
      res.redirect(frontendUrl);
    });
  }
}

// Export single instance
export default new AuthController();
