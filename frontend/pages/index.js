// Home page 
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home({ user }) {
  const router = useRouter();

  useEffect(() => {
    if (user) {
      if (user.role === 'staff') {
        router.push('/staff');
      } else if (user.role === 'client') {
        router.push('/client');
      } else if (user.role === 'admin') {
        router.push('/admin');
      }
    }
  }, [user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Inventory Audit Control Portal</h1>
        <p className="text-lg text-gray-600">Please log in to continue</p>
      </div>
    </div>
  );
}
