'use client';

import { createClient } from '@/utils/supabase/client';
import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';

interface TextEditorProps {
	onNoteCreated: (noteuuId: string) => void;
}

export default function TextEditor({ onNoteCreated }: TextEditorProps) {
	const [text, setText] = useState<string>('');
	const [readTimes, setReadTimes] = useState<number | null>(null);

	const supabase = createClient();

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (text.trim() !== '') {
			const { data, error } = await supabase
				.from('notes')
				.insert([{ text, readTimes }])
				.select();

			if (error) {
				console.error('Error inserting note:', error);
			} else if (data && data.length > 0) {
				setText('');
				setReadTimes(null);
				onNoteCreated(data[0].uuid);
			}
		}
	};

	const isDisabled = text.trim() === '';

	return (
		<form onSubmit={handleSubmit} className="w-full">
			<Textarea
				className="h-48 w-full"
				placeholder="Type something..."
				id="message"
				value={text}
				onChange={(e) => setText(e.target.value)}
			/>
			<div className="flex md:flex-row flex-col gap-2 py-5 w-full ">
				<div className="flex-grow">
					{' '}
					<Label htmlFor="readTimes">
						How many times can this message be read?
					</Label>
					<Select
						onValueChange={(value) =>
							setReadTimes(value === 'unlimited' ? null : Number(value))
						}
					>
						<SelectTrigger className="" id="readTimes">
							<SelectValue placeholder="Unlimited" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="unlimited">Unlimited</SelectItem>
							<SelectItem value="1">1</SelectItem>
							<SelectItem value="2">2</SelectItem>
							<SelectItem value="3">3</SelectItem>
							<SelectItem value="4">4</SelectItem>
							<SelectItem value="5">5</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<Button
					variant={isDisabled ? 'outline' : 'secondary'}
					type="submit"
					disabled={isDisabled}
					className="flex-grow mt-auto bottom-0 align-bottom"
				>
					{isDisabled ? 'Please type something' : 'Submit'}
				</Button>
			</div>
		</form>
	);
}
