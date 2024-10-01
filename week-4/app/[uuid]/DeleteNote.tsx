'use client';

import { useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function DeleteNote({ uuid }: { uuid: string }) {
	const supabase = createClient();

	useEffect(() => {
		const handleBeforeUnload = async () => {
			await supabase.from('notes').delete().eq('uuid', uuid);
		};

		window.addEventListener('beforeunload', handleBeforeUnload);

		return () => {
			window.removeEventListener('beforeunload', handleBeforeUnload);
			handleBeforeUnload();
		};
	}, [uuid, supabase]);

	return null;
}
