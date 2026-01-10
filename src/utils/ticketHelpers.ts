import type { TicketLine } from '../types';
import { DEFAULT_FONT_SIZE } from '../types';

/**
 * デフォルト値で新しいチケット行を作成
 */
export const createDefaultLine = (): TicketLine => ({
	id: crypto.randomUUID(),
	text: '',
	fontSize: DEFAULT_FONT_SIZE,
	bold: false,
	align: 'left',
	marginTop: 0,
	marginRight: 0,
	marginBottom: 0,
	marginLeft: 0,
});

/**
 * 既存の行の設定を複製して新しい行を作成（テキストは空）
 */
export const createLineFromTemplate = (templateLine: TicketLine): TicketLine => ({
	id: crypto.randomUUID(),
	text: '',
	fontSize: templateLine.fontSize,
	bold: templateLine.bold,
	align: templateLine.align,
	marginTop: templateLine.marginTop,
	marginRight: templateLine.marginRight,
	marginBottom: templateLine.marginBottom,
	marginLeft: templateLine.marginLeft,
});
