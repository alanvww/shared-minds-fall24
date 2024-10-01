import Link from 'next/link';
import { Button } from './ui/button';

export default function HeaderPost() {
	return (
		<div className="flex gap-2">
			<Button asChild size="sm" variant={'outline'}>
				<Link href="/post">Post</Link>
			</Button>
		</div>
	);
}
