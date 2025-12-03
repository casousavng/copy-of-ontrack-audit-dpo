import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { APP_NAME, APP_SUBTITLE } from '../constants';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import { api } from '../services/api';

export const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.forgotPassword(email);
      setSuccess(true);
    } catch (error: any) {
      setError(error.message || 'Erro ao enviar email de recuperação');
    } finally {
      setLoading(false);
    }
  };

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
                Email Enviado!
              </h2>
              <p className="text-gray-600 mb-6">
                Se o endereço <strong>{email}</strong> estiver registado, receberá um email com instruções para redefinir a sua password.
              </p>
              <p className="text-sm text-gray-500 mb-8">
                Verifique a sua caixa de entrada e a pasta de spam.
              </p>
              <Button
                onClick={() => navigate('/')}
                fullWidth
              >
                Voltar ao Login
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
          Recuperar Password
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Introduza o seu email para receber instruções de recuperação
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="mr-2" size={16} />
            Voltar ao login
          </button>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
              <Mail className="text-blue-600 flex-shrink-0" size={20} />
              <p className="text-sm text-blue-800">
                Enviaremos um link de recuperação para o seu email. Este link será válido por 1 hora.
              </p>
            </div>

            <Input
              label="Endereço de Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu.email@mousquetaires.com"
              error={error}
              required
            />

            <Button
              type="submit"
              fullWidth
              disabled={loading || !email.trim()}
            >
              {loading ? 'A enviar...' : 'Enviar Email de Recuperação'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
