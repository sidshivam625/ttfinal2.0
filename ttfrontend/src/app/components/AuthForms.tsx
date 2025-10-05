'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { Loader } from '@/utils/Loader';

// Reusable Base Components
const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} className="w-full px-4 py-3 mb-4 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7A2F49] transition-all" />;
const Button = ({ loading, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading: boolean }) => <button {...props} disabled={loading} className="inline-block mx-auto max-w-xs px-6 py-3 bg-transparent border border-[#ef3b57] text-[#ef3b57] font-vt323 rounded hover:bg-[#ef3b57]/20 hover:scale-105 hover:shadow-lg transition-all duration-300 uppercase">{loading ? <Loader/>: children}</button>;

// --- EXPORTED FORM COMPONENTS ---

export const VerifyDelegateForm = ({ onSubmit, loading }: { onSubmit: (delegateId: string, phone: string) => void, loading: boolean }) => {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const delegateId = formData.get('delegateId') as string;
    const phone = formData.get('phone') as string;
    onSubmit(delegateId, phone);
  };
  return <form onSubmit={handleSubmit}>
    <h2 className="text-3xl font-bold text-center text-white mb-2">Delegate Verification</h2>
    <p className="text-center text-gray-400 mb-6">Step 1 of 2</p>
    <Input name="delegateId" placeholder="Delegate ID" required />
    <Input name="phone" placeholder="Phone Number" type="tel" required />
    <Button loading={loading}>Verify Identity</Button>
  </form>;
};

export const RegisterForm = ({ onSubmit, loading, prefilled }: { onSubmit: (email: string, password: string) => void, loading: boolean, prefilled: {delegateId: string, name: string, phone: string} }) => {
   const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    onSubmit(email, password);
  };
  return <form onSubmit={handleSubmit}>
    <h2 className="text-3xl font-bold text-center text-white mb-2">Create Account</h2>
    <p className="text-center text-gray-400 mb-6">Welcome, {prefilled.name}!</p>
    <Input name="email" placeholder="Email Address" type="email" required />
    <Input name="password" placeholder="Password (min. 6 characters)" type="password" required minLength={6} />
    <Button loading={loading}>Create Account & Send Verification Email</Button>
  </form>;
};

export const LoginForm = ({ onSubmit, loading }: { onSubmit: (email: string, password: string) => void, loading: boolean }) => {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    onSubmit(email, password);
  };
  return <form onSubmit={handleSubmit}>
    <h2 className="text-3xl font-bold text-center text-white mb-2">Delegate Login</h2>
    <p className="text-center text-gray-400 mb-6">Welcome back.</p>
    <Input name="email" placeholder="Email Address" type="email" required />
    <Input name="password" placeholder="Password" type="password" required />
    <Button loading={loading}>Sign In</Button>
  </form>;
};