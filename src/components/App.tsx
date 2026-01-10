import jsPDF from 'jspdf';
import React, { useEffect, useState } from 'react';
import type { AppState, TemplateInfo, TemplateWithSvg, Ticket, TicketLine } from '../types';
import { DEFAULT_TEMPLATE_ID } from '../types';
import { createDefaultLine } from '../utils/ticketHelpers';
import styles from './App.module.css';
import { TicketEditor } from './TicketEditor';

export const App: React.FC = () => {
	const [appState, setAppState] = useState<AppState>({
		tickets: [],
		templates: [],
	});
	const [templatesWithSvg, setTemplatesWithSvg] = useState<TemplateWithSvg[]>([]);
	const [isMobile, setIsMobile] = useState(() => {
		if (typeof window === 'undefined') return false;
		return window.matchMedia('(max-width: 768px)').matches;
	});
	const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

	// テンプレート情報とSVGを読み込み
	useEffect(() => {
		const loadTemplates = async () => {
			try {
				const response = await fetch(`${import.meta.env.BASE_URL}templates.json`);
				const templates: TemplateInfo[] = await response.json();

				// 各テンプレートのSVGを読み込む
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

				const initialLine: TicketLine = {
					id: crypto.randomUUID(),
					text: '',
					fontSize: 10.5,
					bold: false,
					align: 'left',
					marginTop: 0,
					marginRight: 0,
					marginBottom: 0,
					marginLeft: 0,
				};
				setAppState((prev) => ({
					...prev,
					templates,
					tickets:
						prev.tickets.length === 0
							? [
									{
										id: crypto.randomUUID(),
										templateType: templates[0]?.id || 'tt-7ticket',
										lines: [initialLine],
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
		const mediaQuery = window.matchMedia('(max-width: 768px)');
		const handleMediaChange = (event: MediaQueryListEvent) => {
			setIsMobile(event.matches);
		};

		mediaQuery.addEventListener('change', handleMediaChange);

		return () => {
			mediaQuery.removeEventListener('change', handleMediaChange);
		};
	}, []);

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

			// PDF初期化（A4）
			const pdf = new jsPDF({
				orientation: 'portrait',
				unit: 'cm',
				format: 'a4',
			});

			const PDF_WIDTH = 21; // A4幅（cm）
			const PDF_HEIGHT = 29.7; // A4高さ（cm）
			const MARGIN_TOP = 0.5; // 上下マージン（cm）
			const TICKET_SPACING = 0.5; // チケット間隔（cm）

			let currentY = MARGIN_TOP;

			// 各チケットのCanvasを取得してPDFに追加
			for (const ticket of appState.tickets) {
				const templateInfo = templateMap.get(ticket.templateType);
				if (!templateInfo) continue;

				const dimension = { width: templateInfo.width, height: templateInfo.height };

				// data-ticket-id属性でチケット要素を特定
				const ticketElement = document.querySelector(`[data-ticket-id="${ticket.id}"]`);
				if (!ticketElement) continue;

				// Canvasを持つ要素を探す
				const canvasElement = ticketElement.querySelector('canvas');
				if (!canvasElement) continue;

				// Canvasから画像を取得
				const imgData = canvasElement.toDataURL('image/png');

				// A4の幅に合わせてスケール
				const scaledWidth = Math.min(dimension.width, PDF_WIDTH - 1);
				const scaledHeight = (scaledWidth / dimension.width) * dimension.height;

				// ページに収まるかチェック
				if (currentY + scaledHeight > PDF_HEIGHT - MARGIN_TOP) {
					// 次のページに
					pdf.addPage();
					currentY = MARGIN_TOP;
				}

				// PDFに画像を追加
				const imgX = (PDF_WIDTH - scaledWidth) / 2; // 中央寄せ
				pdf.addImage(imgData, 'PNG', imgX, currentY, scaledWidth, scaledHeight);

				// チケットの周りに極細線を描画（カットガイド）
				pdf.setLineWidth(0.01); // 極細線
				pdf.setDrawColor(150, 150, 150); // 薄いグレー
				pdf.rect(imgX, currentY, scaledWidth, scaledHeight);
				pdf.setLineWidth(0.2); // デフォルトに戻す

				currentY += scaledHeight + TICKET_SPACING; // 次のチケット位置
			}

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
