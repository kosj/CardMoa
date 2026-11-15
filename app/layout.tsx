import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '은별이 대학생활 노트',
  description:
    '아빠가 은별이의 대학생활을 함께 챙기는 노트. 카드 결제와 수업료를 모아 달마다 생활비를 정리하고, 아빠의 쪽지를 전합니다.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
