'use client';

interface Note {
	id: number;
	uuid: string;
	text: string;
	readTimes: number | null;
	created_at: string;
}

interface NoteContentProps {
	note: Note;
}

export default function NoteContent({ note }: NoteContentProps) {
	return (
		<>
			<p className="text-lg font-semibold mb-2">{note.text}</p>
			<p
				className={`text-sm  ${note.readTimes != null && note.readTimes > 1 ? 'text-gray-500' : 'text-red-500'} `}
			>
				{note.readTimes === null
					? 'This note can be read unlimited times'
					: note.readTimes > 1
						? `This note can be read ${note.readTimes} more time${note.readTimes !== 1 ? 's' : ''}`
						: 'This is the last time you can view this note. It will not be available after you close this page.'}
			</p>
		</>
	);
}