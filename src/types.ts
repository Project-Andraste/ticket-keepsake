/**
 * バーコード領域の境界情報
 */
export interface BarcodeBounds {
	/** X座標（cm） */
	x: number;
	/** Y座標（cm） */
	y: number;
	/** 幅（cm） */
	width: number;
	/** 高さ（cm） */
	height: number;
	/** 回転角度（度） */
	rotation: number;
}

/**
 * QRコード領域の境界情報
 */
export interface QrcodeBounds {
	/** X座標（cm） */
	x: number;
	/** Y座標（cm） */
	y: number;
	/** 幅（cm） */
	width: number;
	/** 高さ（cm） */
	height: number;
}

/**
 * テキスト領域の境界情報
 */
export interface TextAreaBounds {
	/** X座標（cm） */
	x: number;
	/** Y座標（cm） */
	y: number;
	/** 幅（cm） */
	width: number;
	/** 高さ（cm） */
	height: number;
}

/**
 * バーコード生成オプション（カスタマイズ可能な部分のみ）
 */
export interface BarcodeOptions {
	/** バーコードの幅 */
	width?: number;
	/** フォントオプション */
	fontOptions?: string;
	/** フォント名 */
	font?: string;
	/** テキストの配置 */
	textAlign?: string;
	/** テキストの位置 */
	textPosition?: string;
	/** テキストマージン */
	textMargin?: number;
	/** フォントサイズ */
	fontSize?: number;
	/** 背景色 */
	background?: string;
	/** ラインカラー */
	lineColor?: string;
	/** 上マージン */
	marginTop?: number;
	/** 下マージン */
	marginBottom?: number;
	/** 左マージン */
	marginLeft?: number;
	/** 右マージン */
	marginRight?: number;
	/** フラット表示 */
	flat?: boolean;
}

/**
 * チケット行のテキスト設定
 */
export interface TicketLine {
	/** 行の一意識別子 */
	id: string;
	/** 表示テキスト */
	text: string;
	/** フォントサイズ (pt) */
	fontSize: number;
	/** 太字フラグ */
	bold: boolean;
	/** テキスト配置 */
	align: 'left' | 'center' | 'right';
	/** 上マージン (cm) */
	marginTop?: number;
	/** 右マージン (cm) */
	marginRight?: number;
	/** 下マージン (cm) */
	marginBottom?: number;
	/** 左マージン (cm) */
	marginLeft?: number;
}

/**
 * チケット情報
 */
export interface Ticket {
	/** チケットの一意識別子 */
	id: string;
	/** 使用するテンプレートのID */
	templateType: string;
	/** チケットに含まれるテキスト行 */
	lines: TicketLine[];
	/** バーコード値 */
	barcode?: string;
	/** QRコード値 */
	qrcode?: string;
}

/**
 * SVGテンプレート情報
 */
export interface TemplateInfo {
	/** テンプレートの一意識別子 */
	id: string;
	/** テンプレートの表示名 */
	name: string;
	/** SVGファイルのパス */
	svgPath: string;
	/** テンプレートの幅 (cm) */
	width: number;
	/** テンプレートの高さ (cm) */
	height: number;
	/** バーコード生成オプション */
	barcodeOptions?: BarcodeOptions;
}

/**
 * SVGコンテンツを含むテンプレート情報
 */
export interface TemplateWithSvg extends TemplateInfo {
	/** SVGコンテンツ文字列 */
	svgContent: string;
}

/**
 * デフォルトのテンプレートID
 */
export const DEFAULT_TEMPLATE_ID = 'tt-7ticket';

/**
 * アプリケーション状態
 */
export interface AppState {
	/** 現在のチケット一覧 */
	tickets: Ticket[];
	/** 利用可能なテンプレート一覧 */
	templates: TemplateInfo[];
}
