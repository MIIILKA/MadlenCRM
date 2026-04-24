import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import axios from 'axios'
import './Login.scss'

const PRIORITY_CODES = ['UA', 'PL', 'DE', 'SK', 'RO', 'CZ'];
const PHONE_RULES = { 'UA': 9, 'PL': 9, 'DE': 10, 'SK': 9, 'DEFAULT': 9 };

export default function Login() {
    const [isRegister, setIsRegister] = useState(false)
    const [loginType, setLoginType]   = useState('phone')
    const [name, setName]             = useState('')
    const [loginValue, setLoginValue] = useState('')
    const [password, setPassword]     = useState('')
    const [showPass, setShowPass]     = useState(false)
    const [error, setError]           = useState('')
    const [loading, setLoading]       = useState(false)

    const [countries, setCountries] = useState([])
    const [selectedCountry, setSelectedCountry] = useState({ code: '+380', flag: '🇺🇦', name: 'UA' })
    const [showCountryList, setShowCountryList] = useState(false)
    const [phoneBody, setPhoneBody] = useState('')
    const countryListRef = useRef(null)

    const { login, register } = useAuthStore()
    const navigate = useNavigate()

    useEffect(() => {
        const fetchCountries = async () => {
            try {
                const res = await axios.get('https://restcountries.com/v3.1/all?fields=name,idd,flag,cca2');
                const allFormatted = res.data
                    .filter(c => c.idd.root)
                    .map(c => ({
                        name: c.cca2,
                        flag: c.flag,
                        code: c.idd.root + (c.idd.suffixes?.length === 1 ? c.idd.suffixes[0] : ''),
                        fullName: c.name.common
                    }));

                const priority = allFormatted
                    .filter(c => PRIORITY_CODES.includes(c.name))
                    .sort((a, b) => PRIORITY_CODES.indexOf(a.name) - PRIORITY_CODES.indexOf(b.name));

                const others = allFormatted
                    .filter(c => !PRIORITY_CODES.includes(c.name))
                    .sort((a, b) => a.fullName.localeCompare(b.fullName));

                setCountries([...priority, ...others]);
            } catch (err) { console.error(err); }
        };
        fetchCountries();
    }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (countryListRef.current && !countryListRef.current.contains(e.target))
                setShowCountryList(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handlePhoneChange = (e) => {
        let val = e.target.value.replace(/\D/g, '');
        // Для UA прибираємо початковий 0 (напр. 068... → 68...)
        if (selectedCountry.name === 'UA' && val.startsWith('0')) val = val.substring(1);
        const maxLen = PHONE_RULES[selectedCountry.name] || PHONE_RULES.DEFAULT;
        if (val.length <= maxLen) { setPhoneBody(val); setError(''); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // 1. Формуємо правильне значення логіна
        // Якщо це телефон, прибираємо все зайве крім цифр і плюса
        const finalLoginValue = loginType === 'email'
            ? loginValue.trim().toLowerCase()
            : `${selectedCountry.code}${phoneBody.replace(/\D/g, '')}`;

        console.log("🚀 Спроба входу з:", finalLoginValue);

        try {
            let result;
            if (isRegister) {
                result = await register({
                    name: name.trim(),
                    loginValue: finalLoginValue,
                    password
                });
            } else {
                result = await login(finalLoginValue, password);
            }

            if (result.ok) {
                console.log("✅ Авторизація успішна. Роль:", result.user?.role);

                // 2. Розумний редірект
                // Якщо заходить адмін або овнер — кидаємо в кабінет/дашборд
                // Якщо звичайний юзер — на сервіси
                const userRole = result.user?.role;

                if (userRole === 'owner' || userRole === 'admin') {
                    navigate('/profile', { replace: true });
                } else {
                    navigate('/', { replace: true }); // На головну (Services)
                }
            } else {
                setError(result.error || 'Помилка авторизації');
            }
        } catch (err) {
            setError('Сталася помилка на сервері. Спробуйте пізніше.');
        } finally {
            setLoading(false);
        }
    };


    // Скидаємо поля при перемиканні між входом і реєстрацією
    const handleToggleMode = () => {
        setIsRegister(prev => !prev);
        setError('');
        setName('');
        setLoginValue('');
        setPhoneBody('');
        setPassword('');
    };

    return (
        <div className="login">
            <div className="login__bg">
                <div className="login__bg-orb login__bg-orb--1" />
                <div className="login__bg-orb login__bg-orb--2" />
                <div className="login__bg-grid" />
            </div>

            <div className="login__card">
                <div className="login__logo">
                    <div className="login__logo-mark">✦</div>
                    <div className="login__logo-text">
                        <span className="login__logo-name">Madlen</span>
                        <span className="login__logo-sub">CRM</span>
                    </div>
                </div>

                <div className="login__heading">
                    <h1>{isRegister ? 'Створити акаунт' : 'Welcome back'}</h1>
                    <p>{isRegister ? 'Приєднуйтесь до нашої студії' : 'Увійдіть у свій робочий простір'}</p>
                </div>

                <div className="login__tabs">
                    <button
                        type="button"
                        className={`login__tab ${loginType === 'phone' ? 'active' : ''}`}
                        onClick={() => { setLoginType('phone'); setError(''); }}
                    >
                        Телефон
                    </button>
                    <button
                        type="button"
                        className={`login__tab ${loginType === 'email' ? 'active' : ''}`}
                        onClick={() => { setLoginType('email'); setError(''); }}
                    >
                        Пошта
                    </button>
                    <div className={`login__tab-cursor ${loginType}`} />
                </div>

                <form className="login__form" onSubmit={handleSubmit}>
                    {isRegister && (
                        <div className="login__field animate-field">
                            <label>Ваше ім'я</label>
                            <div className="login__input-wrap">
                                <span className="material-symbols-rounded">badge</span>
                                <input
                                    type="text"
                                    placeholder="Ім'я та прізвище"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                    )}

                    <div className="login__field">
                        <label>{loginType === 'email' ? 'Email адреса' : 'Номер телефону'}</label>
                        <div className="login__input-wrap">
                            {loginType === 'email' ? (
                                <>
                                    <span className="material-symbols-rounded">mail</span>
                                    <input
                                        type="email"
                                        placeholder="your@email.com"
                                        value={loginValue}
                                        onChange={e => { setLoginValue(e.target.value); setError(''); }}
                                        required
                                    />
                                </>
                            ) : (
                                <div className="login__phone-container" ref={countryListRef}>
                                    <div
                                        className="login__country-select"
                                        onClick={() => setShowCountryList(!showCountryList)}
                                    >
                                        <span className="f">{selectedCountry.flag}</span>
                                        <span className="code">{selectedCountry.code}</span>
                                        <span className="material-symbols-rounded">expand_more</span>
                                        {showCountryList && (
                                            <ul className="login__country-list">
                                                {countries.map((c, idx) => (
                                                    <li
                                                        key={c.name + idx}
                                                        className={PRIORITY_CODES.includes(c.name) ? 'priority' : ''}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedCountry(c);
                                                            setPhoneBody('');
                                                            setShowCountryList(false);
                                                        }}
                                                    >
                                                        <span className="f">{c.flag}</span>
                                                        <span className="n">{c.name}</span>
                                                        <span className="c">{c.code}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                    <input
                                        type="tel"
                                        placeholder="68 000 00 00"
                                        value={phoneBody}
                                        onChange={handlePhoneChange}
                                        required
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="login__field">
                        <label>Пароль</label>
                        <div className="login__input-wrap">
                            <span className="material-symbols-rounded">lock</span>
                            <input
                                type={showPass ? 'text' : 'password'}
                                placeholder="••••••••"
                                value={password}
                                onChange={e => { setPassword(e.target.value); setError(''); }}
                                required
                                minLength={6}
                            />
                            <button
                                type="button"
                                className="login__toggle-pass"
                                onClick={() => setShowPass(!showPass)}
                            >
                                <span className="material-symbols-rounded">
                                    {showPass ? 'visibility_off' : 'visibility'}
                                </span>
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="login__error">
                            <span className="material-symbols-rounded">error</span>
                            {error}
                        </div>
                    )}

                    <button type="submit" className="login__submit" disabled={loading}>
                        {loading
                            ? <span className="login__spinner" />
                            : (isRegister ? 'Зареєструватися' : 'Увійти')
                        }
                    </button>
                </form>

                <div className="login__divider"><span>або</span></div>
                <button type="button" className="login__google-btn">
                    <img
                        src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg"
                        alt="G"
                    />
                    {isRegister ? 'Зареєструватися через Google' : 'Увійти з Google'}
                </button>

                <div className="login__footer">
                    {isRegister ? 'Вже маєте акаунт?' : 'Немає акаунту?'}
                    <button type="button" onClick={handleToggleMode}>
                        {isRegister ? 'Увійти' : 'Створити зараз'}
                    </button>
                </div>
            </div>
        </div>
    )
}