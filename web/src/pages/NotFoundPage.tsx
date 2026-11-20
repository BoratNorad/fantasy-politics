import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="py-16 text-center">
      <h1 className="page-title">Page not found</h1>
      <Link to="/" className="mt-4 inline-block text-indigo-600 underline">
        Back to your leagues
      </Link>
    </div>
  );
}
