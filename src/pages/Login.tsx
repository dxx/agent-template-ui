import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.scss';

export default function Login() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [errors, setErrors] = useState<{ phone?: string; code?: string }>({});

  const validate = () => {
    const newErrors: { phone?: string; code?: string } = {};
    if (!phone.trim()) {
      newErrors.phone = '手机号不能为空';
    }
    if (!code.trim()) {
      newErrors.code = '验证码不能为空';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.SubmitEvent) => {
    e.preventDefault();
    if (validate()) {
      localStorage.setItem('user_token', phone);
      navigate('/chat');
    }
  };

  return (
    <div className="login-container">
      {/* <div className="login-left">
      </div> */}
      <div className="login-right">
        <div className="login-card">
          <h1 className="login-title">登录</h1>
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label className="form-label">手机号</label>
              <div className="form-field">
                <div className={`input-wrapper ${errors.phone ? 'error' : ''}`}>
                  <span className="input-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  </span>
                  <input
                    type="text"
                    placeholder="输入任意手机号"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (errors.phone) setErrors({ ...errors, phone: undefined });
                    }}
                    className="login-input"
                    maxLength={11}
                  />
                </div>
                <span className={`error-text ${errors.phone ? 'show' : ''}`}>{errors.phone || ''}</span>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">验证码</label>
              <div className="form-field">
                <div className={`input-wrapper ${errors.code ? 'error' : ''}`}>
                  <span className="input-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                      <polyline points="9 12 12 15 16 10"/>
                    </svg>
                  </span>
                  <input
                    type="text"
                    placeholder="输入任意验证码"
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value);
                      if (errors.code) setErrors({ ...errors, code: undefined });
                    }}
                    className="login-input"
                    maxLength={6}
                  />
                  <button type="button" className="code-btn">
                    获取验证码
                  </button>
                </div>
                <span className={`error-text ${errors.code ? 'show' : ''}`}>{errors.code || ''}</span>
              </div>
            </div>
            <button type="submit" className="login-button">
              登 录
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
