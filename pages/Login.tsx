import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { APP_NAME, APP_SUBTITLE } from '../constants';
import { api } from '../services/api';
import { UserRole } from '../types';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('dot1@mousquetaires.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e?: React.FormEvent, quickEmail?: string) => {
    if (e) e.preventDefault();
    const loginEmail = quickEmail || email;
    const loginPassword = quickEmail ? undefined : password; // Acesso rápido não usa password
    
    try {
      const { user } = await api.login(loginEmail, loginPassword);
      
      // Ensure roles is an array
      const userRoles = Array.isArray(user.roles) ? user.roles : [];
      
      const authData = { 
        token: '123', 
        email: user.email,
        userId: user.id,
        name: user.fullname,
        roles: userRoles
      };
      localStorage.setItem('ontrack_auth', JSON.stringify(authData));
      
      // Redirect based on role (prioridade: ADMIN > AMONT > ADERENTE > DOT)
      if (userRoles.includes(UserRole.ADMIN)) {
        navigate('/admin/dashboard');
      } else if (userRoles.includes(UserRole.AMONT)) {
        navigate('/amont/dashboard');
      } else if (userRoles.includes(UserRole.ADERENTE)) {
        navigate('/aderente/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      setError('Email ou password incorretos!');
      console.error('Login error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
            <div className="bg-black p-4 rounded-lg flex items-center gap-3">
                 <div className="bg-mousquetaires text-white p-1 rounded font-bold text-2xl">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
                </div>
                <div className="text-white">
                    <h1 className="text-2xl font-bold leading-none">{APP_NAME}</h1>
                    <p className="text-xs text-gray-400 font-medium">{APP_SUBTITLE}</p>
                </div>
            </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          BEM-VINDO!
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
          
          {/* Quick Login Buttons for Demo */}
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-3 text-center">Acesso Rápido (Demo):</p>
            <div className="flex flex-col gap-2">
              <Button 
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setEmail('admin@mousquetaires.com');
                  setPassword('admin');
                }}
                className="w-full justify-start"
              >
                ⚙️ Admin
              </Button>
              <Button 
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setEmail('amont@mousquetaires.com');
                  setPassword('amont');
                }}
                className="w-full justify-start"
              >
                👔 Amont
              </Button>
              <Button 
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setEmail('dot1@mousquetaires.com');
                  setPassword('dot1');
                }}
                className="w-full justify-start"
              >
                👨‍💼 DOT
              </Button>
              <Button 
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setEmail('aderente1@intermarche.pt');
                  setPassword('aderente1');
                }}
                className="w-full justify-start"
              >
                🏪 Aderente
              </Button>
            </div>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">ou</span>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleLogin}>
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={error}
              placeholder="seu.email@mousquetaires.com"
              required
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-mousquetaires focus:ring-mousquetaires border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Manter sessão iniciada
                </label>
              </div>

              <div className="text-sm">
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Esqueci a password
                </button>
              </div>
            </div>

            <Button type="submit" fullWidth className="bg-blue-600 hover:bg-blue-700">
              ENTRAR
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};