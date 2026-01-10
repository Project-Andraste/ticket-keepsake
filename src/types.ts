// チケット行のテキスト設定
export interface TicketLine {
	id: string;
	text: string;
	fontSize: number;
	bold: boolean;
	align: 'left' | 'center' | 'right';
	marginTop?: number;
	marginRight?: number;
	marginBottom?: number;
	marginLeft?: number;
}

// チケット情報
export interface Ticket {
	id: string;
	templateType: string;
	lines: TicketLine[];
}

// SVGテンプレート情報
export interface TemplateInfo {
	id: string;
	name: string;
	svgPath: string;
	width: number;
	height: number;
}

// SVGコンテンツを含むテンプレート情報
export interface TemplateWithSvg extends TemplateInfo {
	svgContent: string;
}

// デフォルト値の定数
export const DEFAULT_FONT_SIZE = 10.5;
export const DEFAULT_TEMPLATE_ID = 'tt-7ticket';

// アプリケーション状態
export interface AppState {
	tickets: Ticket[];
	templates: TemplateInfo[];
}
