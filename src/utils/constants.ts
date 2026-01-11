/**
 * アプリケーション全体で使用する定数定義
 */

/** 基準スケール: 1cm = 96px / 2.54 ≈ 37.79527559px */
const BASE_SCALE = 96 / 2.54;

/** 画質向上のための倍率 */
const SCALE_MULTIPLIER = 3;

/** CSS準拠のスケールを高解像度化 */
export const CANVAS_SCALE = BASE_SCALE * SCALE_MULTIPLIER;

/** PDF生成時のA4サイズと余白設定（単位: cm） */
export const PDF_CONFIG = {
	/** A4用紙の幅 (cm) - 横向き */
	WIDTH: 29.7,
	/** A4用紙の高さ (cm) - 横向き */
	HEIGHT: 21,
	/** 上下マージン (cm) */
	MARGIN_TOP: 0.5,
	/** チケット間の間隔 (cm) */
	TICKET_SPACING: 0.5,
	/** カットガイドの線幅 */
	CUT_LINE_WIDTH: 0.01,
	/** カットガイドの色 (RGB) */
	CUT_LINE_COLOR: [150, 150, 150] as const,
} as const;

/** モバイル判定のブレークポイント (px) */
export const MOBILE_BREAKPOINT = 768;

/** デフォルトのフォント設定 */
export const DEFAULT_FONT = {
	/** フォントファミリー */
	FAMILY: "'Noto Sans JP', sans-serif",
	/** 最小フォントサイズ (px) */
	MIN_SIZE: 6,
	/** デフォルトのフォントサイズ (pt) */
	DEFAULT_SIZE: 10.5,
} as const;

/** デフォルトのテキスト行設定 */
export const DEFAULT_LINE = {
	/** フォントサイズ (pt) */
	FONT_SIZE: 10.5,
	/** 太字フラグ */
	BOLD: false,
	/** テキストの配置 */
	ALIGN: 'left' as const,
	/** 上マージン (cm) */
	MARGIN_TOP: 0,
	/** 右マージン (cm) */
	MARGIN_RIGHT: 0,
	/** 下マージン (cm) */
	MARGIN_BOTTOM: 0,
	/** 左マージン (cm) */
	MARGIN_LEFT: 0,
} as const;

/** バーコード生成のデフォルト設定 */
export const BARCODE_CONFIG = {
	/** バーコードのフォーマット */
	FORMAT: 'CODE128' as const,
	/** バーコードが利用する横幅の割合 (0-1) */
	WIDTH_RATIO: 0.8,
	/** バーコードの余白 */
	MARGIN: 0,
	/** 値の表示フラグ */
	DISPLAY_VALUE: true,
} as const;

/** QRコード生成のデフォルト設定 */
export const QRCODE_CONFIG = {
	/** QRコードの余白 */
	MARGIN: 0,
	/** エラー訂正レベル */
	ERROR_CORRECTION_LEVEL: 'L' as const,
} as const;
