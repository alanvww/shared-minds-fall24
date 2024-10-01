'use client';

import { useState } from 'react';
import TextEditor from '@/components/textEditor';
import { Button } from '@/components/ui/button';

export default function NotesPage() {
	const [latestNoteuuId, setLatestNoteuuId] = useState<string | null>(null);
	const [copyStatus, setCopyStatus] = useState<string>('');

	const handleNoteCreated = (noteuuId: string) => {
		setLatestNoteuuId(noteuuId);
		setCopyStatus('');
	};

	const copyLinkToClipboard = () => {
		if (latestNoteuuId) {
			const link = `${window.location.origin}/${latestNoteuuId}`;
			navigator.clipboard.writeText(link).then(
				() => {
					setCopyStatus('Link copied to clipboard!');
				},
				(err) => {
					console.error('Could not copy text: ', err);
					setCopyStatus('Failed to copy link. Please try again.');
				}
			);
		}
	};

	return (
		<div className="container mx-auto px-4 py-8 w-full">
			<h1 className="text-3xl font-bold mb-8">Read & Leave</h1>
			<TextEditor onNoteCreated={handleNoteCreated} />
			{latestNoteuuId && (
				<div className="mt-4 p-4  rounded-md">
					<p className="mb-2">Your note has been created! Here's the link:</p>
					<div className="flex items-center gap-2">
						<input
							type="text"
							readOnly
							value={`${window.location.origin}/${latestNoteuuId}`}
							className="flex-grow p-2 border rounded"
						/>
						<Button onClick={copyLinkToClipboard}>Copy Link</Button>
					</div>
					{copyStatus && (
						<p className="mt-2 text-sm text-gray-600">{copyStatus}</p>
					)}
				</div>
			)}
		</div>
	);
}
