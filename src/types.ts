// チケット行のテキスト設定
export interface TicketLine {
	id: string;
	text: string;
	fontSize: number;
	bold: boolean;
	align: 'left' | 'center' | 'right';
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

// アプリケーション状態
export interface AppState {
	tickets: Ticket[];
	templates: TemplateInfo[];
}
