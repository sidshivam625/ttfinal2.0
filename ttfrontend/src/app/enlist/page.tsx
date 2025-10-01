'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { httpsCallable } from 'firebase/functions';
import { functions, auth } from '../../../lib/firebaseClient';
import { signInWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { VerifyDelegateForm, RegisterForm, LoginForm } from '../components/AuthForms';

type AuthStep = 'login' | 'verify' | 'register';
interface VerifiedDelegate { delegateId: string; name: string; phone: string; }

export default function AuthPage() {
  const [step, setStep] = useState<AuthStep>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifiedData, setVerifiedData] = useState<VerifiedDelegate | null>(null);

  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user) {
      router.push('/profile');
    }
  }, [user, authLoading, router]);

  const handleVerify = async (delegateId: string, phone: string) => {
    setLoading(true);
    setError(null);
    try {
      const verifyDelegate = httpsCallable(functions, 'verifyDelegate');
      const result = await verifyDelegate({ delegateId, phoneNumber: phone });
      const data = result.data as { success: boolean, delegate: VerifiedDelegate };
      setVerifiedData(data.delegate);
      setStep('register');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (email: string, password: string) => {
    if (!verifiedData) return setError("Verification data is missing.");
    setLoading(true);
    setError(null);
    try {
      const createAccount = httpsCallable(functions, 'createAccount');
      await createAccount({ ...verifiedData, email, password });

      await signInWithEmailAndPassword(auth, email, password);
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
      }
      // The useEffect will handle redirecting to /profile
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // The useEffect will handle redirecting to /profile
    } catch (err: any)
      { setError("Failed to sign in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const Card = ({ children }: { children: React.ReactNode }) => <div className="w-full max-w-md bg-gray-800 p-8 rounded-lg shadow-2xl shadow-pink-900/20">{children}</div>;

  const renderStep = () => {
    switch(step) {
      case 'verify': return <VerifyDelegateForm onSubmit={handleVerify} loading={loading} />;
      case 'register': return <RegisterForm onSubmit={handleRegister} loading={loading} prefilled={verifiedData!} />;
      case 'login': default: return <LoginForm onSubmit={handleLogin} loading={loading} />;
    }
  };

  if (authLoading || user) {
      return null; // The AuthProvider shows a loader and this page will redirect
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
        <Card>
          {renderStep()}
        </Card>
        {error && <p className="w-full max-w-md mt-4 text-center text-sm text-red-400 bg-red-900/50 p-3 rounded-lg">{error}</p>}
        <div className="mt-6 text-center">
            {step === 'login' && <p className="text-gray-400">No account? <button onClick={() => setStep('verify')} className="font-semibold text-pink-500 hover:underline">Sign Up</button></p>}
            {step !== 'login' && <p className="text-gray-400">Already registered? <button onClick={() => setStep('login')} className="font-semibold text-pink-500 hover:underline">Log In</button></p>}
        </div>
    </main>
  );
}
