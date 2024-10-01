'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

interface Note {
	id: number;
	uuid: string;
	text: string;
	readTimes: number | null;
	created_at: string;
}

interface NoteContentProps {
	initialNote: Note;
}

export default function NoteContent({ initialNote }: NoteContentProps) {
	const [note, setNote] = useState<Note | null>(initialNote);
	const [isLoading, setIsLoading] = useState(true);
	const supabase = createClient();

	useEffect(() => {
		const updateReadTimes = async () => {
			if (note && note.readTimes !== null && note.readTimes >= 1) {
				const { data, error } = await supabase
					.from('notes')
					.update({ readTimes: note.readTimes - 1 })
					.eq('uuid', note.uuid)
					.select()
					.single();

				if (!error && data) {
					setNote(data as Note);
				}
			} else if (note && note.readTimes === 0) {
				await supabase.from('notes').delete().eq('uuid', note.uuid);
				setNote(null);
			}
			setIsLoading(false);
		};

		updateReadTimes();
	}, [note, supabase]);

	if (isLoading) {
		return <p>Loading...</p>;
	}

	if (!note) {
		return <p>This note has been deleted.</p>;
	}

	return (
		<>
			<p className="text-lg font-semibold mb-2">{note.text}</p>
			<p
				className={`${
					note.readTimes === null || note.readTimes >= 1
						? 'text-gray-500'
						: 'text-red-600'
				} text-sm`}
			>
				{note.readTimes === null
					? 'This note can be read unlimited times'
					: note.readTimes >= 1
						? `This note can be read ${note.readTimes} more time${note.readTimes !== 1 ? 's' : ''}`
						: 'This note will not be available after you close this tab.'}
			</p>
		</>
	);
}
