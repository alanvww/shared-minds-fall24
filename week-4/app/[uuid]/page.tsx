// app/notes/[id]/page.tsx
import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';

export const dynamic = 'force-dynamic';

async function getNoteAndUpdateReadTimes(uuid: string) {
	const supabase = createClient();

	// Fetch the note
	const { data: note, error } = await supabase
		.from('notes')
		.select('*')
		.eq('uuid', uuid)
		.single();

	if (error || !note) {
		return null;
	}

	// Decrement readTimes if it's not null
	if (note.readTimes !== null) {
		if (note.readTimes > 1) {
			await supabase
				.from('notes')
				.update({ readTimes: note.readTimes - 1 })
				.eq('id', note.id);
			note.readTimes -= 1;
		} else {
			// Delete the note if readTimes reaches 0
			await supabase.from('notes').delete().eq('uuid', note.uuid);
			return 'deleted';
		}
	}

	return note;
}

export default async function NotePage({
	params,
}: {
	params: { uuid: string };
}) {
	const note = await getNoteAndUpdateReadTimes(params.uuid);

	if (note === null) {
		notFound();
	}

	if (note === 'deleted') {
		return <div>This note has been deleted.</div>;
	}

	return (
		<div className="container mx-auto px-4 py-8 w-full">
			<Card className="mb-4">
				<CardHeader>
					<CardTitle className="text-sm font-medium">
						Note #{note.id} - Created{' '}
						{formatDistanceToNow(new Date(note.created_at))} ago
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-lg font-semibold mb-2">{note.text}</p>
					<p className="text-sm text-gray-500">
						{note.readTimes === null
							? 'This note can be read unlimited times'
							: `This note can be read ${note.readTimes} more time${note.readTimes !== 1 ? 's' : ''}`}
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
