import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { EmptyState } from '../components/ui/States';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <EmptyState
        icon={Compass}
        title="Page not found"
        message="The page you’re looking for doesn’t exist."
        action={<Link to="/dashboard" className="btn-primary">Go to dashboard</Link>}
      />
    </div>
  );
}
