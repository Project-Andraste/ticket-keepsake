import React, { useEffect, useState } from 'react';
import type { TemplateInfo, Ticket, TicketLine } from '../types';
import { TicketDisplay } from './TicketDisplay';
import { TicketLineEditor } from './TicketLineEditor';

interface TicketEditorProps {
	ticket: Ticket;
	ticketNumber: number;
	onUpdate: (ticket: Ticket) => void;
	onDelete: () => void;
}

export const TicketEditor: React.FC<TicketEditorProps> = ({ ticket, ticketNumber, onUpdate, onDelete }) => {
	const [templates, setTemplates] = useState<TemplateInfo[]>([]);

	// テンプレート情報を読み込み
	useEffect(() => {
		const loadTemplates = async () => {
			try {
				const response = await fetch('/templates.json');
				const data: TemplateInfo[] = await response.json();
				setTemplates(data);
			} catch (error) {
				console.error('Failed to load templates:', error);
			}
		};
		loadTemplates();
	}, []);

	const handleAddLine = () => {
		const newLine: TicketLine = {
			id: crypto.randomUUID(),
			text: '',
			fontSize: 16,
			bold: false,
			align: 'left',
		};
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

	return (
		<div style={styles.container} data-ticket-id={ticket.id}>
			<div style={styles.header}>
				<h2>チケット {ticketNumber}</h2>
				<button onClick={onDelete} style={styles.deleteButton}>
					このチケットを削除
				</button>
			</div>

			<div style={styles.templateSelector}>
				<label>テンプレート: </label>
				<select value={ticket.templateType} onChange={(e) => handleChangeTemplate(e.target.value)} style={styles.select}>
					{templates.map((template) => (
						<option key={template.id} value={template.id}>
							{template.name}
						</option>
					))}
				</select>
			</div>

			<div style={styles.editorSection}>
				<h3>テキスト編集</h3>
				{ticket.lines.map((line) => (
					<TicketLineEditor key={line.id} line={line} onUpdate={handleUpdateLine} onDelete={() => handleDeleteLine(line.id)} />
				))}
				<button onClick={handleAddLine} style={styles.addButton}>
					+ 行を追加
				</button>
			</div>

			<div style={styles.previewSection}>
				<h3>プレビュー</h3>
				<TicketDisplay ticket={ticket} />
			</div>
		</div>
	);
};

const styles = {
	container: {
		border: '1px solid #e0e0e0',
		borderRadius: '8px',
		padding: '1.5rem',
		marginBottom: '1.5rem',
		backgroundColor: '#fff',
		boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
	} as React.CSSProperties,
	header: {
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: '1rem',
		paddingBottom: '1rem',
		borderBottom: '2px solid #f0f0f0',
	} as React.CSSProperties,
	deleteButton: {
		padding: '0.5rem 1rem',
		backgroundColor: '#ff6b6b',
		color: 'white',
		border: 'none',
		borderRadius: '4px',
		cursor: 'pointer',
		fontSize: '14px',
	} as React.CSSProperties,
	templateSelector: {
		marginBottom: '1.5rem',
		display: 'flex',
		alignItems: 'center',
		gap: '0.5rem',
	} as React.CSSProperties,
	select: {
		padding: '0.5rem 0.75rem',
		border: '1px solid #ccc',
		borderRadius: '4px',
		fontSize: '14px',
	} as React.CSSProperties,
	content: {
		display: 'grid',
		gridTemplateColumns: '1fr 1fr',
		gap: '2rem',
	} as React.CSSProperties,
	editorSection: {
		minHeight: '400px',
	} as React.CSSProperties,
	previewSection: {
		display: 'flex',
		flexDirection: 'column',
	} as React.CSSProperties,
	addButton: {
		padding: '0.75rem 1.5rem',
		backgroundColor: '#4CAF50',
		color: 'white',
		border: 'none',
		borderRadius: '4px',
		cursor: 'pointer',
		fontSize: '14px',
		marginTop: '1rem',
	} as React.CSSProperties,
};
