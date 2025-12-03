import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { APP_NAME, APP_SUBTITLE } from '../constants';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validToken, setValidToken] = useState<boolean | null>(null);

  useEffect(() => {
    // Verificar se o token é válido
    const verifyToken = async () => {
      if (!token) {
        setValidToken(false);
        setError('Link de recuperação inválido');
        return;
      }

      try {
        await api.verifyResetToken(token);
        setValidToken(true);
      } catch (error) {
        setValidToken(false);
        setError('Link de recuperação expirado ou inválido');
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validações
    if (password.length < 6) {
      setError('A password deve ter pelo menos 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setError('As passwords não coincidem');
      return;
    }

    if (!token) {
      setError('Token inválido');
      return;
    }

    setLoading(true);

    try {
      await api.resetPassword(token, password);
      setSuccess(true);
      
      // Redirecionar para login após 3 segundos
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (error: any) {
      setError(error.message || 'Erro ao redefinir password');
    } finally {
      setLoading(false);
    }
  };

  if (validToken === null) {
    return (
      <div className="min-h-screen bg-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <p className="text-center text-gray-600">A verificar link...</p>
        </div>
      </div>
    );
  }

  if (validToken === false) {
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
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Link Inválido
              </h2>
              <p className="text-gray-600 mb-6">
                {error}
              </p>
              <p className="text-sm text-gray-500 mb-8">
                Por favor, solicite um novo link de recuperação.
              </p>
              <div className="space-y-3">
                <Button
                  onClick={() => navigate('/forgot-password')}
                  fullWidth
                >
                  Solicitar Novo Link
                </Button>
                <Button
                  onClick={() => navigate('/')}
                  variant="outline"
                  fullWidth
                >
                  Voltar ao Login
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
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
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Password Redefinida!
              </h2>
              <p className="text-gray-600 mb-6">
                A sua password foi alterada com sucesso.
              </p>
              <p className="text-sm text-gray-500 mb-8">
                Será redirecionado para o login em instantes...
              </p>
              <Button
                onClick={() => navigate('/')}
                fullWidth
              >
                Ir para Login
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
          Redefinir Password
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Escolha uma nova password para a sua conta
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <Input
              label="Nova Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              error={error && !confirmPassword ? error : ''}
              required
            />

            <Input
              label="Confirmar Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repita a password"
              error={error && confirmPassword ? error : ''}
              required
            />

            {password && confirmPassword && password !== confirmPassword && (
              <p className="text-sm text-red-600">
                As passwords não coincidem
              </p>
            )}

            {password && password.length < 6 && (
              <p className="text-sm text-orange-600">
                A password deve ter pelo menos 6 caracteres
              </p>
            )}

            <Button
              type="submit"
              fullWidth
              disabled={loading || !password || !confirmPassword || password !== confirmPassword || password.length < 6}
            >
              {loading ? 'A redefinir...' : 'Redefinir Password'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
