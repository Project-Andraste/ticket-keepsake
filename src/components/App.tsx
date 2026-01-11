import jsPDF from 'jspdf';
import React, { useEffect, useState } from 'react';
import type { AppState, TemplateInfo, TemplateWithSvg, Ticket } from '../types';
import { DEFAULT_TEMPLATE_ID } from '../types';
import { MOBILE_BREAKPOINT } from '../utils/constants';
import { generateTicketsPDF } from '../utils/pdfHelpers';
import { createDefaultLine } from '../utils/ticketHelpers';
import styles from './App.module.css';
import { TicketEditor } from './TicketEditor';

const SESSION_STORAGE_KEY = 'ticket-keepsake-data';

export const App: React.FC = () => {
	const [appState, setAppState] = useState<AppState>(() => {
		// セッションストレージから復元を試みる
		try {
			const saved = sessionStorage.getItem(SESSION_STORAGE_KEY);
			if (saved) {
				const parsed = JSON.parse(saved);
				return {
					tickets: parsed.tickets || [],
					templates: [],
				};
			}
		} catch (error) {
			console.error('セッションストレージからの復元に失敗:', error);
		}
		return {
			tickets: [],
			templates: [],
		};
	});
	const [templatesWithSvg, setTemplatesWithSvg] = useState<TemplateWithSvg[]>([]);
	const [isMobile, setIsMobile] = useState(() => {
		if (typeof window === 'undefined') return false;
		return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`).matches;
	});
	const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

	// テンプレート情報とSVGを読み込み
	useEffect(() => {
		const loadTemplates = async () => {
			try {
				const response = await fetch(`${import.meta.env.BASE_URL}templates.json`);
				const templates: TemplateInfo[] = await response.json();

				const templatesData = await Promise.all(
					templates.map(async (template) => {
						try {
							const svgResponse = await fetch(
								`${import.meta.env.BASE_URL}${template.svgPath.startsWith('/') ? template.svgPath.slice(1) : template.svgPath}`,
							);
							const svgContent = await svgResponse.text();
							return { ...template, svgContent };
						} catch (error) {
							console.error(`Failed to load SVG for template ${template.id}:`, error);
							return { ...template, svgContent: '' };
						}
					}),
				);

				setTemplatesWithSvg(templatesData);

				setAppState((prev) => ({
					...prev,
					templates,
					tickets:
						prev.tickets.length === 0
							? [
									{
										id: crypto.randomUUID(),
										templateType: templates[0]?.id || DEFAULT_TEMPLATE_ID,
										lines: [createDefaultLine()],
									},
								]
							: prev.tickets,
				}));
			} catch (error) {
				console.error('Failed to load templates:', error);
			}
		};
		loadTemplates();
	}, []);

	// ビューポート幅でモバイル判定
	useEffect(() => {
		const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
		const handleMediaChange = (event: MediaQueryListEvent) => {
			setIsMobile(event.matches);
		};

		mediaQuery.addEventListener('change', handleMediaChange);

		return () => {
			mediaQuery.removeEventListener('change', handleMediaChange);
		};
	}, []);

	// チケットデータが変更されたらセッションストレージに保存
	useEffect(() => {
		if (appState.tickets.length > 0) {
			try {
				const dataToSave = {
					tickets: appState.tickets,
				};
				sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(dataToSave));
			} catch (error) {
				console.error('セッションストレージへの保存に失敗:', error);
			}
		}
	}, [appState.tickets]);

	const handleUpdateTicket = (updatedTicket: Ticket) => {
		setAppState({
			...appState,
			tickets: appState.tickets.map((ticket) => (ticket.id === updatedTicket.id ? updatedTicket : ticket)),
		});
	};

	const handleDeleteTicket = (ticketId: string) => {
		if (appState.tickets.length === 1) {
			alert('最低1つのチケットが必要です');
			return;
		}
		const updatedTickets = appState.tickets.filter((ticket) => ticket.id !== ticketId);
		setAppState({
			...appState,
			tickets: updatedTickets,
		});
		if (isMobile && selectedTicketId === ticketId) {
			setSelectedTicketId(updatedTickets[0]?.id ?? null);
		}
	};

	const handleAddTicket = () => {
		const defaultTemplate = appState.templates[0]?.id || DEFAULT_TEMPLATE_ID;
		const newTicket: Ticket = {
			id: crypto.randomUUID(),
			templateType: defaultTemplate,
			lines: [createDefaultLine()],
		};
		setAppState({
			...appState,
			tickets: [...appState.tickets, newTicket],
		});
		if (isMobile) {
			setSelectedTicketId(newTicket.id);
		}
	};

	const handleSavePDF = async () => {
		try {
			// テンプレート情報をマップに変換（ID→情報）
			const templateMap = new Map(appState.templates.map((t) => [t.id, t]));

			// PDF初期化（A4横向き）
			const pdf = new jsPDF({
				orientation: 'landscape',
				unit: 'cm',
				format: 'a4',
			});

			// ヘルパー関数を使用してPDFを生成
			generateTicketsPDF(pdf, appState.tickets, templateMap);

			pdf.save('tickets.pdf');
		} catch (error) {
			console.error('PDF生成エラー:', error);
			alert('PDF保存に失敗しました');
		}
	};

	const currentSelectedId = appState.tickets.find((t) => t.id === selectedTicketId)?.id ?? appState.tickets[0]?.id ?? '';

	return (
		<div className={styles.container}>
			<div className={styles.actionsBar}>
				<button onClick={handleAddTicket} className={styles.primaryButton}>
					+ チケットを追加
				</button>
				<button onClick={handleSavePDF} className={styles.secondaryButton}>
					PDF として保存
				</button>
				{isMobile && appState.tickets.length > 0 ? (
					<div className={styles.mobileTicketSelectWrapper}>
						<label className={styles.mobileTicketLabel} htmlFor="ticket-select">
							表示中のチケット
						</label>
						<select
							id="ticket-select"
							className={styles.mobileTicketSelect}
							value={currentSelectedId}
							onChange={(e) => setSelectedTicketId(e.target.value)}
						>
							{appState.tickets.map((ticket, index) => (
								<option key={ticket.id} value={ticket.id}>
									チケット {index + 1}
								</option>
							))}
						</select>
					</div>
				) : null}
			</div>

			<div className={styles.ticketsContainer}>
				{appState.tickets.map((ticket, index) => (
					<div
						key={ticket.id}
						className={isMobile && currentSelectedId && ticket.id !== currentSelectedId ? styles.ticketHiddenMobile : undefined}
					>
						<TicketEditor
							ticket={ticket}
							ticketNumber={index + 1}
							templates={appState.templates}
							templatesWithSvg={templatesWithSvg}
							onUpdate={handleUpdateTicket}
							onDelete={() => handleDeleteTicket(ticket.id)}
						/>
					</div>
				))}
			</div>
		</div>
	);
};
