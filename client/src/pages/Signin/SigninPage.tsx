import {useState} from 'react';
import styles from './SigninPage.module.css';
import {Link, useNavigate} from "react-router";
import {signInApi} from "../../api/auth.ts";

export const SigninPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = await signInApi({email, password})
    if(!data.token) {
      setErrors(data.errors)
      return;
    }
    localStorage.setItem("token", data.token)
    setErrors({})
    navigate("/")
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Вход</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={errors.email ? styles.inputError : ''}
          />
          {errors.email && <span className={styles.error}>{errors.email}</span>}
        </div>

        <div className={styles.field}>
          <label htmlFor="password">Пароль</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={errors.password ? styles.inputError : ''}
          />
          {errors.password && <span className={styles.error}>{errors.password}</span>}
        </div>

        <button type="submit" className={styles.button}>
          Войти
        </button>
      </form>

      <Link to={"/signup"}>signup</Link>
    </div>
  );
};