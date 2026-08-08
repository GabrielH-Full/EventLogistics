import React, { useState } from 'react';
import { useAuth, ApiError } from './AuthContext';
import MobileLoginView from './MobileLoginView';
import DesktopLoginView from './DesktopLoginView';

export default function LoginView() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(username.trim(), password);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Não foi possível conectar ao servidor.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const presentationProps = {
    username,
    setUsername,
    password,
    setPassword,
    error,
    submitting,
    onSubmit: handleSubmit
  };

  return (
    <>
      <div className="block lg:hidden">
        <MobileLoginView {...presentationProps} />
      </div>
      <div className="hidden lg:flex w-full min-h-screen bg-gray-50 items-center justify-center">
        <DesktopLoginView {...presentationProps} />
      </div>
    </>
  );
}
