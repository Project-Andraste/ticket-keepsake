import React, { useEffect, useRef, useState } from 'react';
import type { TemplateInfo, TemplateWithSvg, Ticket, TicketLine } from '../types';
import { createDefaultLine, createLineFromTemplate } from '../utils/ticketHelpers';
import { TicketDisplay } from './TicketDisplay';
import styles from './TicketEditor.module.css';
import { TicketLineEditor } from './TicketLineEditor';

interface TicketEditorProps {
	ticket: Ticket;
	ticketNumber: number;
	templates: TemplateInfo[];
	templatesWithSvg: TemplateWithSvg[];
	onUpdate: (ticket: Ticket) => void;
	onDelete: () => void;
}

export const TicketEditor: React.FC<TicketEditorProps> = ({ ticket, ticketNumber, templates, templatesWithSvg, onUpdate, onDelete }) => {
	const [menuOpen, setMenuOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// メニュー外クリックで閉じる
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
				setMenuOpen(false);
			}
		};

		if (menuOpen) {
			document.addEventListener('mousedown', handleClickOutside);
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [menuOpen]);

	const handleAddLine = () => {
		const lastLine = ticket.lines[ticket.lines.length - 1];
		const newLine = lastLine ? createLineFromTemplate(lastLine) : createDefaultLine();
		onUpdate({ ...ticket, lines: [...ticket.lines, newLine] });
	};

	const handleInsertLineAfter = (index: number) => {
		const referenceLine = ticket.lines[index];
		const newLine = referenceLine ? createLineFromTemplate(referenceLine) : createDefaultLine();
		const updatedLines = [...ticket.lines];
		updatedLines.splice(index + 1, 0, newLine);
		onUpdate({ ...ticket, lines: updatedLines });
	};

	const handleUpdateLine = (updatedLine: TicketLine) => {
		const updatedLines = ticket.lines.map((line) => (line.id === updatedLine.id ? updatedLine : line));
		onUpdate({ ...ticket, lines: updatedLines });
	};

	const handleDeleteLine = (lineId: string) => {
		const updatedLines = ticket.lines.filter((line) => line.id !== lineId);
		onUpdate({ ...ticket, lines: updatedLines });
	};

	const handleSwapLines = (index: number) => {
		if (index < 0 || index >= ticket.lines.length - 1) return;
		const updatedLines = [...ticket.lines];
		[updatedLines[index], updatedLines[index + 1]] = [updatedLines[index + 1], updatedLines[index]];
		onUpdate({ ...ticket, lines: updatedLines });
	};

	const handleChangeTemplate = (newTemplate: string) => {
		onUpdate({ ...ticket, templateType: newTemplate });
	};

	const handleBarcodeChange = (value: string) => {
		onUpdate({ ...ticket, barcode: value });
	};

	const handleQrcodeChange = (value: string) => {
		onUpdate({ ...ticket, qrcode: value });
	};

	const handleExport = () => {
		const ticketData = {
			templateType: ticket.templateType,
			lines: ticket.lines,
			barcode: ticket.barcode,
			qrcode: ticket.qrcode,
		};
		const json = JSON.stringify(ticketData, null, 2);
		const blob = new Blob([json], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `ticket-${ticketNumber}.json`;
		a.click();
		URL.revokeObjectURL(url);
		setMenuOpen(false);
	};

	const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (e) => {
			try {
				const json = e.target?.result as string;
				const ticketData = JSON.parse(json);

				// 既存のIDを保持しつつ、インポートしたデータで更新
				onUpdate({
					...ticket,
					templateType: ticketData.templateType || ticket.templateType,
					lines: ticketData.lines || ticket.lines,
					barcode: ticketData.barcode,
					qrcode: ticketData.qrcode,
				});
				setMenuOpen(false);
			} catch (error) {
				console.error('インポートエラー:', error);
				alert('チケットデータの読み込みに失敗しました');
			}
		};
		reader.readAsText(file);
		// ファイル入力をリセット（同じファイルを再度選択可能にする）
		event.target.value = '';
	};

	const handleDeleteClick = () => {
		setMenuOpen(false);
		onDelete();
	};

	return (
		<div className={styles.container} data-ticket-id={ticket.id}>
			<div className={styles.header}>
				<div className={styles.headerLeft}>
					<h2 className={styles.title}>チケット {ticketNumber}</h2>
				</div>
				<div className={styles.headerRight} ref={menuRef}>
					<button onClick={() => setMenuOpen(!menuOpen)} className={styles.menuButton} aria-label="メニュー">
						⋮
					</button>
					{menuOpen && (
						<div className={styles.dropdownMenu}>
							<button onClick={() => fileInputRef.current?.click()} className={styles.menuItem}>
								📥 インポート
							</button>
							<button onClick={handleExport} className={styles.menuItem}>
								📤 エクスポート
							</button>
							<div className={styles.menuDivider} />
							<button onClick={handleDeleteClick} className={styles.menuItemDanger}>
								🗑️ チケットを削除
							</button>
						</div>
					)}
					<input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
				</div>
			</div>

			<div className={styles.content}>
				<div className={styles.previewSection}>
					<div className={styles.stickyBlock}>
						<div className={styles.previewBlock}>
							<h3 className={styles.previewHeading}>プレビュー</h3>
							<TicketDisplay ticket={ticket} templatesWithSvg={templatesWithSvg} />
						</div>
						<div className={styles.templateBar}>
							<label className={styles.templateLabel} htmlFor={`template-${ticket.id}`}>
								テンプレート
							</label>
							<select
								id={`template-${ticket.id}`}
								value={ticket.templateType}
								onChange={(e) => handleChangeTemplate(e.target.value)}
								className={styles.select}
							>
								{templates.map((template) => (
									<option key={template.id} value={template.id}>
										{template.name}
									</option>
								))}
							</select>
						</div>
					</div>
				</div>

				<div className={styles.editorSection}>
					<h3>バーコード・QRコード</h3>
					<div className={styles.barcodeSection}>
						<label htmlFor={`barcode-${ticket.id}`}>バーコード:</label>
						<input
							id={`barcode-${ticket.id}`}
							type="text"
							value={ticket.barcode || ''}
							onChange={(e) => handleBarcodeChange(e.target.value)}
							placeholder="例: 1234567890"
							className={styles.barcodeInput}
						/>

						<label htmlFor={`qrcode-${ticket.id}`} style={{ marginTop: '1rem' }}>
							QRコード:
						</label>
						<input
							id={`qrcode-${ticket.id}`}
							type="text"
							value={ticket.qrcode || ''}
							onChange={(e) => handleQrcodeChange(e.target.value)}
							placeholder="例: https://example.com"
							className={styles.barcodeInput}
						/>
					</div>

					<h3>テキスト編集</h3>
					{ticket.lines.map((line, index) => (
						<React.Fragment key={line.id}>
							<TicketLineEditor line={line} onUpdate={handleUpdateLine} onDelete={() => handleDeleteLine(line.id)} />
							<div className={styles.lineActions}>
								{index < ticket.lines.length - 1 && (
									<button onClick={() => handleSwapLines(index)} className={styles.swapButton} title="上下を入れ替え">
										<span className="material-symbols-outlined">swap_vert</span>
									</button>
								)}
								<button onClick={() => handleInsertLineAfter(index)} className={styles.insertButton} title="ここに行を挿入">
									<span className="material-symbols-outlined">add</span>
								</button>
							</div>
						</React.Fragment>
					))}
				</div>
			</div>
		</div>
	);
};
