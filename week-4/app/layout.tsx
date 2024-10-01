import { ThemeSwitcher } from '@/components/theme-switcher';
import { GeistSans } from 'geist/font/sans';
import { ThemeProvider } from 'next-themes';
import Link from 'next/link';
import './globals.css';

const defaultUrl = process.env.VERCEL_URL
	? `https://${process.env.VERCEL_URL}`
	: 'http://localhost:3000';

export const metadata = {
	metadataBase: new URL(defaultUrl),
	title: 'Time - Shared Minds Fall 2024',
	description: 'Create and share time-limited notes',
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en" className={GeistSans.className} suppressHydrationWarning>
			<body className="bg-background text-foreground">
				<ThemeProvider
					attribute="class"
					defaultTheme="system"
					enableSystem
					disableTransitionOnChange
				>
					<div className="min-h-screen flex flex-col">
						<nav className="w-full border-b border-b-foreground/10">
							<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
								<div className="flex justify-between items-center h-16">
									<div className="flex-shrink-0">
										<Link href={'/'} className="font-semibold">
											Time - Shared Minds Fall 2024
										</Link>
									</div>
									<ThemeSwitcher />
								</div>
							</div>
						</nav>

						<main className="flex-grow">
							<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
								{children}
							</div>
						</main>

						<footer className="border-t">
							<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-sm">
								<p>
									Designed & Developed by{' '}
									<a
										href="https://alan.ooo"
										target="_blank"
										className="font-bold hover:underline"
										rel="noreferrer"
									>
										Alan Ren
									</a>
								</p>
							</div>
						</footer>
					</div>
				</ThemeProvider>
			</body>
		</html>
	);
}
