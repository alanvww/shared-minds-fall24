import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import NoteContent from './NoteContent';

interface Note {
	id: number;
	uuid: string;
	text: string;
	readTimes: number | null;
	created_at: string;
}

export const dynamic = 'force-dynamic';

async function getNoteWithoutUpdating(uuid: string): Promise<Note | null> {
	const supabase = createClient();

	const { data: note, error } = await supabase
		.from('notes')
		.select('*')
		.eq('uuid', uuid)
		.single();

	if (error || !note) {
		return null;
	}

	return note as Note;
}

export default async function NotePage({
	params,
}: {
	params: { uuid: string };
}) {
	const note = await getNoteWithoutUpdating(params.uuid);

	if (note === null) {
		notFound();
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
					<NoteContent initialNote={note} />
				</CardContent>
			</Card>
		</div>
	);
}
