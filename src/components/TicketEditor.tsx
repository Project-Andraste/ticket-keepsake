import React from 'react';
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
	const handleAddLine = () => {
		const lastLine = ticket.lines[ticket.lines.length - 1];
		const newLine = lastLine ? createLineFromTemplate(lastLine) : createDefaultLine();
		onUpdate({ ...ticket, lines: [...ticket.lines, newLine] });
	};

	const handleUpdateLine = (updatedLine: TicketLine) => {
		const updatedLines = ticket.lines.map((line) => (line.id === updatedLine.id ? updatedLine : line));
		onUpdate({ ...ticket, lines: updatedLines });
	};

	const handleDeleteLine = (lineId: string) => {
		const updatedLines = ticket.lines.filter((line) => line.id !== lineId);
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

	return (
		<div className={styles.container} data-ticket-id={ticket.id}>
			<div className={styles.header}>
				<div className={styles.headerLeft}>
					<h2 className={styles.title}>チケット {ticketNumber}</h2>
				</div>
				<button onClick={onDelete} className={styles.deleteButton}>
					このチケットを削除
				</button>
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
					{ticket.lines.map((line) => (
						<TicketLineEditor key={line.id} line={line} onUpdate={handleUpdateLine} onDelete={() => handleDeleteLine(line.id)} />
					))}
					<button onClick={handleAddLine} className={styles.addButton}>
						+ 行を追加
					</button>
				</div>
			</div>
		</div>
	);
};
