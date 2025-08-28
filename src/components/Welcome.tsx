'use client';

import Link from 'next/link';

export default function Welcome() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-yellow-50">
      <div className="bg-white/80 rounded-3xl shadow-2xl px-12 py-16 flex flex-col items-center max-w-lg border border-blue-100">
        <div className="text-7xl mb-6">🍕🌮🍗</div>
        <h1 className="text-5xl font-extrabold text-blue-900 mb-4 text-center drop-shadow">Welcome to the Byte Hackathon!</h1>
        <p className="text-lg text-gray-700 mb-10 text-center max-w-md">
  The home page is rendered <code className="bg-gray-100 rounded px-2 py-1 font-mono text-blue-900 text-base">app/src/page.tsx</code>.<br/>
  When clicking the button below, notice that the route changes to 
  <code className="bg-gray-100 rounded px-2 py-1 font-mono text-blue-900 text-base">/demo</code>
  which routes to <code className="bg-gray-100 rounded px-2 py-1 font-mono text-blue-900 text-base">app/src/demo/page.tsx</code>.
</p>
        <Link href="/demo">
          <button className="px-8 py-4 bg-blue-700 text-white font-bold rounded-xl shadow-xl text-xl hover:bg-blue-800 transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2">
            Go to Receipt Printer Demo
          </button>
        </Link>
      </div>
    </div>
  );
}

