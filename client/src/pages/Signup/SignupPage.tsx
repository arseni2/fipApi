import {useState} from 'react';
import styles from './SignupPage.module.css';
import {Link, useNavigate} from "react-router";
import {signUpApi} from "../../api/auth.ts";

export const SignupPage = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = await signUpApi({email, name, password})
    if(!data.status) {
      setErrors(data.errors)
      return;
    }
    navigate("/signin")
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Регистрация</h2>
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
          <label htmlFor="name">Имя (латиницей)</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={errors.name ? styles.inputError : ''}
          />
          {errors.name && <span className={styles.error}>{errors.name}</span>}
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
          Зарегистрироваться
        </button>
      </form>


      <Link to={"/signin"}>signin</Link>
    </div>
  );
};