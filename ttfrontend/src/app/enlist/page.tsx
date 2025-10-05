'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { httpsCallable } from 'firebase/functions';
import { functions, auth } from '../../../lib/firebaseClient';
import { signInWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { Loader } from '@/utils/Loader';

// --- TYPE DEFINITIONS ---
type AuthStep = 'login' | 'verify' | 'register';
interface VerifiedDelegate { delegateId: string; name: string; phone: string; }

// --- STYLED AUTH FORM COMPONENTS ---
const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input
        {...props}
        className="w-full px-4 py-3 mb-4  bg-[#1b1b1b]/50 text-white border border-[#7a2f49] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ef3b57] transition-all font-vt323"
    />
);
const Button = ({ loading, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading: boolean }) => (
    <button
        {...props}
        disabled={loading}
        className="w-full hover:cursor-pointer px-4 py-3 font-vt323 uppercase tracking-wider text-lg text-white bg-[#ef3b57] rounded-lg hover:bg-[#ff4c6a] disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-300 transform hover:scale-105"
    >
        {loading ? <Loader/> : children}
    </button>
);

// --- FORM COMPONENTS (RegisterForm is updated) ---

const VerifyDelegateForm = ({ onSubmit, loading }: { onSubmit: (delegateId: string, phone: string) => void, loading: boolean }) => {
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onSubmit(formData.get('delegateId') as string, formData.get('phone') as string);
  };
  return <form onSubmit={handleSubmit}>
    <h2 className="font-press-start-2p text-center text-[#ffdcdc] mb-2">// VERIFY IDENTITY</h2>
    <p className="font-vt323 text-center text-gray-400 mb-8">STEP 01: AUTHENTICATION REQUIRED</p>
    <Input name="delegateId" placeholder="Delegate ID" required />
    <Input name="phone" placeholder="Phone Number" type="tel" required />
    <Button loading={loading}>Verify</Button>
  </form>;
};

const RegisterForm = (
  { onSubmit, loading, prefilled, checkName }:
  { onSubmit: (name: string, email: string, password: string) => void; loading: boolean; prefilled: VerifiedDelegate; checkName: (name: string) => Promise<void> }
) => {
  const [nameError, setNameError] = useState<string | null>(null);
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = (formData.get('name') as string || '').trim();
    if (!name) { setNameError('Username is required'); return; }
    if (nameError) return;
    onSubmit(name, formData.get('email') as string, formData.get('password') as string);
  };
  const onNameBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const name = (e.currentTarget.value || '').trim();
    if (!name) { setNameError('Username is required'); return; }
    try { await checkName(name); setNameError(null); } catch (err: any) { setNameError(err?.message || 'Username not available'); }
  };
  return (
    <form onSubmit={handleSubmit}>
      <h2 className="font-press-start-2p text-center text-[#ffdcdc] mb-2">// CREATE ACCOUNT</h2>
      <p className="font-vt323 text-center text-gray-400 mb-8">STEP 02: WELCOME, OPERATIVE</p>
      <Input name="name" placeholder="Choose a unique username" required defaultValue={prefilled.name} onBlur={onNameBlur} />
      {nameError && <p className="text-sm text-red-400 -mt-3 mb-3">{nameError}</p>}
      <Input name="email" placeholder="Email Address" type="email" required />
      <Input name="password" placeholder="Password (min. 6 characters)" type="password" required minLength={6} />
      <Button loading={loading}>Enlist</Button>
    </form>
  );
};

const LoginForm = ({ onSubmit, loading }: { onSubmit: (email: string, password: string) => void, loading: boolean }) => {
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onSubmit(formData.get('email') as string, formData.get('password') as string);
  };
  return <form className='' onSubmit={handleSubmit}>
    <h2 className="font-press-start-2p text-center text-[#ffdcdc] mb-2">// OPERATOR LOGIN</h2>
    <p className="font-vt323 text-center  text-gray-400 mb-8">THE CREATOR AWAITS YOUR RETURN.</p>
    <Input name="email" placeholder="Email Address" type="email" required />
    <Input name="password" placeholder="Password" type="password" required />
    <Button loading={loading}>Sign In</Button>
  </form>;
};

// --- MAIN PAGE LOGIC (handleRegister is updated) ---
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
    setLoading(true); setError(null);
    try {
      const verifyDelegate = httpsCallable(functions, 'verifyDelegate');
      const result = await verifyDelegate({ delegateId, phoneNumber: phone });
      const data = result.data as { success: boolean, delegate: VerifiedDelegate };
      setVerifiedData(data.delegate);
      setStep('register');
    } catch (err: any) { setError(err.message);
    } finally { setLoading(false); }
  };

  // Check username availability using backend callable
  const checkName = async (name: string) => {
    const fn = httpsCallable(functions, 'checkUsernameAvailable');
    const res = await fn({ username: name });
    const data = res.data as { success: boolean; available: boolean };
    if (!data?.success || !data.available) throw new Error('Username already taken');
  };

  const handleRegister = async (name: string, email: string, password: string) => {
    if (!verifiedData) return setError("Verification data is missing.");
    setLoading(true); setError(null);
    try {
      const createAccount = httpsCallable(functions, 'createAccount');
      // Pass the user-chosen name to the backend
      await createAccount({ ...verifiedData, name, email, password });

      await signInWithEmailAndPassword(auth, email, password);
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
      }
      // Navigate to profile; it will auto-refresh when verification is complete
      router.push('/profile');
    } catch (err: any) { setError(err.message);
    } finally { setLoading(false); }
  };

  const handleLogin = async (email: string, password: string) => {
    setLoading(true); setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) { setError("Failed to sign in. Please check your credentials.");
    } finally { setLoading(false); }
  };

  const Card = ({ children }: { children: React.ReactNode }) => ( <div className="w-full max-w-md bg-[#2b0f1a]/50 p-8 rounded-xl border border-[#7a2f49] shadow-lg"> {children} </div> );
  const renderStep = () => {
    switch(step) {
      case 'verify': return <VerifyDelegateForm onSubmit={handleVerify} loading={loading} />;
      case 'register': return <RegisterForm onSubmit={handleRegister} loading={loading} prefilled={verifiedData!} checkName={checkName} />;
      case 'login': default: return <LoginForm onSubmit={handleLogin} loading={loading} />;
    }
  };

  if (authLoading || user) { return null; }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 ">
        <Card> {renderStep()} </Card>
        {error && <p className="w-full max-w-md mt-4 text-center text-sm text-red-400 bg-red-900/50 p-3 rounded-lg">{error}</p>}
        <div className="mt-6 text-center text-gray-400 text-xs font-press-start-2p">
            {step === 'login' && <p>Not working for THE CREATOR? <button onClick={() => setStep('verify')} className="font-semibold cursor-pointer text-[#ef3b57] hover:underline">Enlist Now</button></p>}
            {step !== 'login' && <p>Already Granted Access? <button onClick={() => setStep('login')} className="font-semibold cursor-pointer text-[#ef3b57] hover:underline">Log In</button></p>}
        </div>
    </main>
  );
}