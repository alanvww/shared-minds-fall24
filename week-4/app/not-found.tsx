import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
	return (
		<div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
			<h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
			<p className="text-xl mb-8">
				Oops! The page or note you're looking for doesn't exist.
			</p>
			<p className="mb-8">
				It might have been moved, deleted, or perhaps never existed in the first
				place.
			</p>
			<Button asChild>
				<Link href="/">Return to Home</Link>
			</Button>
		</div>
	);
}
