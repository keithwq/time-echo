import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function UserIndex() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/user/profile');
  }, [router]);

  return null;
}
