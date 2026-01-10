import React from 'react';
import type { TicketLine } from '../types';

interface TicketLineEditorProps {
	line: TicketLine;
	onUpdate: (line: TicketLine) => void;
	onDelete: () => void;
}

const MIN_FONT_SIZE = 8;
const MAX_FONT_SIZE = 48;
const DEFAULT_FONT_SIZE = 16;

export const TicketLineEditor: React.FC<TicketLineEditorProps> = ({ line, onUpdate, onDelete }) => {
	const handleFontSizeChange = (value: string) => {
		const parsed = parseInt(value, 10);
		if (isNaN(parsed)) {
			// 無効な値の場合はデフォルト値を使用
			onUpdate({ ...line, fontSize: DEFAULT_FONT_SIZE });
			return;
		}
		// 範囲内に制約
		const clampedValue = Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, parsed));
		onUpdate({ ...line, fontSize: clampedValue });
	};
	return (
		<div style={styles.lineContainer}>
			<input
				type="text"
				value={line.text}
				onChange={(e) => onUpdate({ ...line, text: e.target.value })}
				placeholder="チケットに記載するテキストを入力"
				style={styles.textInput}
			/>
			<div style={styles.controlsContainer}>
				<div style={styles.controlGroup}>
					<label>フォントサイズ: </label>
					<input
						type="number"
						value={line.fontSize}
						onChange={(e) => handleFontSizeChange(e.target.value)}
						min={MIN_FONT_SIZE}
						max={MAX_FONT_SIZE}
						style={styles.numberInput}
					/>
					<span>px</span>
				</div>

				<div style={styles.controlGroup}>
					<select
						value={line.align}
						onChange={(e) =>
							onUpdate({
								...line,
								align: e.target.value as 'left' | 'center' | 'right',
							})
						}
						style={styles.select}
					>
						<option value="left">左</option>
						<option value="center">中央</option>
						<option value="right">右</option>
					</select>
				</div>

				<button onClick={onDelete} style={styles.deleteButton}>
					削除
				</button>
			</div>
		</div>
	);
};

const styles = {
	lineContainer: {
		borderBottom: '1px solid #ddd',
		paddingBottom: '1rem',
		marginBottom: '1rem',
	} as React.CSSProperties,
	textInput: {
		width: '100%',
		padding: '8px',
		marginBottom: '0.5rem',
		fontSize: '14px',
		fontFamily: 'inherit',
		border: '1px solid #ccc',
		borderRadius: '4px',
	} as React.CSSProperties,
	controlsContainer: {
		display: 'flex',
		gap: '1rem',
		flexWrap: 'wrap',
		alignItems: 'center',
	} as React.CSSProperties,
	controlGroup: {
		display: 'flex',
		alignItems: 'center',
		gap: '0.5rem',
	} as React.CSSProperties,
	numberInput: {
		width: '60px',
		padding: '4px',
		border: '1px solid #ccc',
		borderRadius: '4px',
	} as React.CSSProperties,
	select: {
		padding: '4px 8px',
		border: '1px solid #ccc',
		borderRadius: '4px',
	} as React.CSSProperties,
	deleteButton: {
		padding: '0.5rem 1rem',
		backgroundColor: '#ff6b6b',
		color: 'white',
		border: 'none',
		borderRadius: '4px',
		cursor: 'pointer',
	} as React.CSSProperties,
};
