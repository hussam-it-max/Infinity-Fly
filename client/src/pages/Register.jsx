import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import NavBar from "./navBar";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlane, faUser, faEnvelope, faLock, faPhone } from "@fortawesome/free-solid-svg-icons";
import { register } from "../services/authServices";
import styles from "./Auth.module.css";

export default function Register() {
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect") || "/flights";
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name?.trim() || !email?.trim() || !password) {
      toast.error("Please fill in name, email and password");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await register({ name: name.trim(), email: email.trim(), password, phone: phone.trim() || undefined });
      toast.success("Account created! Please log in.");
      navigate(`/login${redirect !== "/flights" ? `?redirect=${encodeURIComponent(redirect)}` : ""}`, { replace: true });
    } catch (err) {
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
          <h1>Create account</h1>
          <p>Join Infinity Fly to book flights and manage your trips</p>
        </div>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label>Full name</label>
            <div className={styles.inputWrap}>
              <FontAwesomeIcon icon={faUser} className={styles.inputIcon} />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                autoComplete="name"
              />
            </div>
          </div>
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
            <label>Password (min 6 characters)</label>
            <div className={styles.inputWrap}>
              <FontAwesomeIcon icon={faLock} className={styles.inputIcon} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>
          </div>
          <div className={styles.field}>
            <label>Phone (optional)</label>
            <div className={styles.inputWrap}>
              <FontAwesomeIcon icon={faPhone} className={styles.inputIcon} />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+33 6 12 34 56 78"
                autoComplete="tel"
              />
            </div>
          </div>
          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </form>
        <p className={styles.footer}>
          Already have an account?{" "}
          <Link to={`/login${redirect !== "/flights" ? `?redirect=${encodeURIComponent(redirect)}` : ""}`}>
            Log in
          </Link>
        </p>
      </div>
    </div>
    </>
  );
}
