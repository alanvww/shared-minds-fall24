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
	const [note, setNote] = useState<Note>(initialNote);
	const [isLoading, setIsLoading] = useState(true);
	const [hasUpdated, setHasUpdated] = useState(false);
	const supabase = createClient();

	useEffect(() => {
		const updateReadTimes = async () => {
			if (!hasUpdated && note.readTimes !== null && note.readTimes > 0) {
				const { data, error } = await supabase
					.from('notes')
					.update({ readTimes: note.readTimes - 1 })
					.eq('uuid', note.uuid)
					.select()
					.single();

				if (!error && data) {
					setNote(data as Note);
					setHasUpdated(true);
				}
			}
			setIsLoading(false);
		};

		updateReadTimes();
	}, [note, supabase, hasUpdated]);

	if (isLoading) {
		return <p>Loading...</p>;
	}

	const isLastView = note.readTimes === 0;

	return (
		<>
			<p className="text-lg font-semibold mb-2">{note.text}</p>
			<p
				className={`${
					note.readTimes === null || note.readTimes > 0
						? 'text-gray-500'
						: 'text-red-600'
				} text-sm`}
			>
				{note.readTimes === null
					? 'This note can be read unlimited times'
					: note.readTimes > 0
						? `This note can be read ${note.readTimes} more time${note.readTimes !== 1 ? 's' : ''}`
						: 'This is the last time you can view this note. It will be deleted after you close this page.'}
			</p>
		</>
	);
}