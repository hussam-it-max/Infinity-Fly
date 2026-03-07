import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import NavBar from "./navBar";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlane, faEnvelope, faLock } from "@fortawesome/free-solid-svg-icons";
import { login } from "../services/authServices";
import styles from "./Auth.module.css";

export default function Login() {
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect") || "/flights";
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email?.trim() || !password) {
      toast.error("Please enter email and password");
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
      toast.success("Welcome back!");
      navigate(redirect, { replace: true });
    } catch (err) {
      // Error toast shown by handleApiError
      setLoading(false);
    }
  };

  return (
    <>
      <NavBar />
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <FontAwesomeIcon icon={faPlane} className={styles.icon} />
          <h1>Log in to Infinity Fly</h1>
          <p>Continue your booking or manage your trips</p>
        </div>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label>Email</label>
            <div className={styles.inputWrap}>
              <FontAwesomeIcon icon={faEnvelope} className={styles.inputIcon} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
          </div>
          <div className={styles.field}>
            <label>Password</label>
            <div className={styles.inputWrap}>
              <FontAwesomeIcon icon={faLock} className={styles.inputIcon} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
          </div>
          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>
        <p className={styles.footer}>
          Don't have an account?{" "}
          <Link to={`/register${redirect !== "/flights" ? `?redirect=${encodeURIComponent(redirect)}` : ""}`}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
    </>
  );
}
