'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { GraduationCap, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

type Mode = 'signin' | 'signup';

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    // 핸들러 안에서 생성 — SSR/사전 렌더링 중에는 실행되지 않음
    const supabase = createClient();

    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push('/dashboard');
        router.refresh();
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage(
          '가입 확인 이메일이 발송되었습니다. 이메일을 확인한 후 로그인해주세요.'
        );
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode((m) => (m === 'signin' ? 'signup' : 'signin'));
    setError(null);
    setMessage(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-100 via-pink-50 to-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* 로고 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-3xl mb-4 bg-gradient-to-br from-rose-400 to-pink-400 shadow-md shadow-rose-200">
            <GraduationCap className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">고은별 대학생활 가계부</h1>
          <p className="text-sm text-gray-500 mt-1">딸아이 학교생활 지출 관리</p>
        </div>

        {/* 카드 */}
        <div className="bg-white rounded-3xl border border-rose-100 shadow-sm shadow-rose-100/40 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-5">
            {mode === 'signin' ? '로그인' : '회원가입'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                이메일
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-rose-100 bg-rose-50/40 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-rose-300 focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-300 disabled:opacity-60 disabled:text-gray-500"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                비밀번호
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                placeholder="••••••••"
                className="w-full rounded-xl border border-rose-100 bg-rose-50/40 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-rose-300 focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-300 disabled:opacity-60 disabled:text-gray-500"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5">
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {message && (
              <div className="flex items-start gap-2 rounded-lg bg-green-50 border border-green-200 px-3 py-2.5">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                <p className="text-sm text-green-700">{message}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-rose-400 to-pink-400 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-rose-200 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-opacity"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === 'signin' ? '로그인' : '가입하기'}
            </button>
          </form>

          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={toggleMode}
              className="text-sm text-rose-500 hover:text-rose-600 hover:underline"
            >
              {mode === 'signin'
                ? '계정이 없으신가요? 회원가입'
                : '이미 계정이 있으신가요? 로그인'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
