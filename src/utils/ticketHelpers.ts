/**
 * チケット行の作成・操作に関するヘルパー関数
 */

import type { TicketLine } from '../types';
import { DEFAULT_LINE } from './constants';

/**
 * デフォルト値で新しいチケット行を作成
 * @returns 新しいチケット行オブジェクト
 */
export const createDefaultLine = (): TicketLine => ({
	id: crypto.randomUUID(),
	text: '',
	fontSize: DEFAULT_LINE.FONT_SIZE,
	bold: DEFAULT_LINE.BOLD,
	align: DEFAULT_LINE.ALIGN,
	marginTop: DEFAULT_LINE.MARGIN_TOP,
	marginRight: DEFAULT_LINE.MARGIN_RIGHT,
	marginBottom: DEFAULT_LINE.MARGIN_BOTTOM,
	marginLeft: DEFAULT_LINE.MARGIN_LEFT,
});

/**
 * 既存の行の設定を複製して新しい行を作成（テキストは空）
 * @param templateLine - テンプレートとなる行
 * @returns 新しいチケット行オブジェクト
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
