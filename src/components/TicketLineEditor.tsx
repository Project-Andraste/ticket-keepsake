import React from 'react';
import type { TicketLine } from '../types';
import styles from './TicketLineEditor.module.css';

interface TicketLineEditorProps {
	line: TicketLine;
	onUpdate: (line: TicketLine) => void;
	onDelete: () => void;
}

const FONT_SIZE_OPTIONS = [8, 9, 10, 10.5, 11, 12, 13, 14, 15, 16, 18, 20, 24, 28, 32, 36, 40, 48];
const DEFAULT_FONT_SIZE = 10.5;

export const TicketLineEditor: React.FC<TicketLineEditorProps> = ({ line, onUpdate, onDelete }) => {
	const handleFontSizeChange = (value: string) => {
		const parsed = parseFloat(value);
		if (isNaN(parsed)) {
			onUpdate({ ...line, fontSize: DEFAULT_FONT_SIZE });
			return;
		}
		onUpdate({ ...line, fontSize: parsed });
	};

	const handleOffsetChange = (key: 'marginTop' | 'marginRight' | 'marginBottom' | 'marginLeft', value: string) => {
		const parsed = parseFloat(value) || 0;
		onUpdate({ ...line, [key]: parsed });
	};

	return (
		<div className={styles.lineContainer}>
			<input
				type="text"
				value={line.text}
				onChange={(e) => onUpdate({ ...line, text: e.target.value })}
				placeholder="チケットに記載するテキストを入力"
				className={styles.textInput}
			/>

			<div className={styles.marginGroup}>
				<span className={styles.marginLabel}>余白:</span>
				<div className={styles.marginInputs}>
					<div className={styles.marginInputWrapper}>
						<label className={styles.marginInputLabel}>上</label>
						<input
							type="number"
							value={line.marginTop ?? 0.1}
							onChange={(e) => handleOffsetChange('marginTop', e.target.value)}
							step="0.05"
							className={styles.marginInput}
						/>
					</div>
					<div className={styles.marginInputWrapper}>
						<label className={styles.marginInputLabel}>右</label>
						<input
							type="number"
							value={line.marginRight ?? 0.2}
							onChange={(e) => handleOffsetChange('marginRight', e.target.value)}
							step="0.05"
							className={styles.marginInput}
						/>
					</div>
					<div className={styles.marginInputWrapper}>
						<label className={styles.marginInputLabel}>下</label>
						<input
							type="number"
							value={line.marginBottom ?? 0.1}
							onChange={(e) => handleOffsetChange('marginBottom', e.target.value)}
							step="0.05"
							className={styles.marginInput}
						/>
					</div>
					<div className={styles.marginInputWrapper}>
						<label className={styles.marginInputLabel}>左</label>
						<input
							type="number"
							value={line.marginLeft ?? 0.2}
							onChange={(e) => handleOffsetChange('marginLeft', e.target.value)}
							step="0.05"
							className={styles.marginInput}
						/>
					</div>
				</div>
				<span className={styles.marginUnit}>cm</span>
			</div>

			<div className={styles.controlsRow}>
				<div className={styles.controlGroup}>
					<select value={line.fontSize} onChange={(e) => handleFontSizeChange(e.target.value)} className={styles.select}>
						{FONT_SIZE_OPTIONS.map((size) => (
							<option key={size} value={size}>
								{size}pt
							</option>
						))}
					</select>
				</div>

				<button
					onClick={() => onUpdate({ ...line, bold: !line.bold })}
					className={`${styles.iconButton} ${line.bold ? styles.iconButtonActive : ''}`}
					title="太字"
				>
					<span className="material-symbols-outlined">format_bold</span>
				</button>

				<div className={styles.toggleButtonGroup}>
					<button
						onClick={() => onUpdate({ ...line, align: 'left' })}
						className={`${styles.toggleButton} ${styles.toggleButtonLeft} ${line.align === 'left' ? styles.toggleButtonActive : ''}`}
						title="左揃え"
					>
						<span className="material-symbols-outlined">format_align_left</span>
					</button>

					<button
						onClick={() => onUpdate({ ...line, align: 'center' })}
						className={`${styles.toggleButton} ${styles.toggleButtonMiddle} ${line.align === 'center' ? styles.toggleButtonActive : ''}`}
						title="中央揃え"
					>
						<span className="material-symbols-outlined">format_align_center</span>
					</button>

					<button
						onClick={() => onUpdate({ ...line, align: 'right' })}
						className={`${styles.toggleButton} ${styles.toggleButtonRight} ${line.align === 'right' ? styles.toggleButtonActive : ''}`}
						title="右揃え"
					>
						<span className="material-symbols-outlined">format_align_right</span>
					</button>
				</div>

				<div style={{ flex: 1 }} />

				<button onClick={onDelete} className={styles.deleteButton}>
					削除
				</button>
			</div>
		</div>
	);
};
