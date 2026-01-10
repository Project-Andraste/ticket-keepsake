/**
 * SVGパース・解析に関するユーティリティ関数
 */

import type { BarcodeBounds, QrcodeBounds, TextAreaBounds } from '../types';

/**
 * SVGコンテンツから編集可能な要素の順序を取得
 * @param svgContent - SVGコンテンツ文字列
 * @returns 要素タイプの配列 ('text' | 'barcode' | 'qrcode')
 */
export const parseEditableOrder = (svgContent: string): Array<'text' | 'barcode' | 'qrcode'> => {
	const parser = new DOMParser();
	const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
	const editableElements = Array.from(svgDoc.querySelectorAll('.editable'));

	const order: Array<'text' | 'barcode' | 'qrcode'> = [];
	editableElements.forEach((el) => {
		if (el.classList.contains('barcode')) order.push('barcode');
		else if (el.classList.contains('qrcode')) order.push('qrcode');
		else if (el.classList.contains('text')) order.push('text');
	});

	return order;
};

/**
 * SVGコンテンツからテキスト領域の境界情報を抽出
 * @param svgContent - SVGコンテンツ文字列
 * @returns テキスト領域の境界情報、見つからない場合はnull
 */
export const parseTextAreaBounds = (svgContent: string): TextAreaBounds | null => {
	const parser = new DOMParser();
	const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
	const editableElement = svgDoc.querySelector('.editable.text');

	if (!editableElement) return null;

	return {
		x: parseFloat(editableElement.getAttribute('x') || '0'),
		y: parseFloat(editableElement.getAttribute('y') || '0'),
		width: parseFloat(editableElement.getAttribute('width') || '0'),
		height: parseFloat(editableElement.getAttribute('height') || '0'),
	};
};

/**
 * SVGコンテンツからバーコード領域の境界情報を抽出
 * @param svgContent - SVGコンテンツ文字列
 * @returns バーコード領域の境界情報、見つからない場合はnull
 */
export const parseBarcodeBounds = (svgContent: string): BarcodeBounds | null => {
	const parser = new DOMParser();
	const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
	const barcodeElement = svgDoc.querySelector('.editable.barcode');

	if (!barcodeElement) return null;

	const transform = barcodeElement.getAttribute('transform') || '';
	const rotateMatch = transform.match(/rotate\((-?\d+(?:\.\d+)?)\)/);
	const rotation = rotateMatch ? parseFloat(rotateMatch[1]) : 0;

	return {
		x: parseFloat(barcodeElement.getAttribute('x') || '0'),
		y: parseFloat(barcodeElement.getAttribute('y') || '0'),
		width: parseFloat(barcodeElement.getAttribute('width') || '0'),
		height: parseFloat(barcodeElement.getAttribute('height') || '0'),
		rotation,
	};
};

/**
 * SVGコンテンツからQRコード領域の境界情報を抽出
 * @param svgContent - SVGコンテンツ文字列
 * @returns QRコード領域の境界情報、見つからない場合はnull
 */
export const parseQRCodeBounds = (svgContent: string): QrcodeBounds | null => {
	const parser = new DOMParser();
	const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
	const qrcodeElement = svgDoc.querySelector('.editable.qrcode');

	if (!qrcodeElement) return null;

	return {
		x: parseFloat(qrcodeElement.getAttribute('x') || '0'),
		y: parseFloat(qrcodeElement.getAttribute('y') || '0'),
		width: parseFloat(qrcodeElement.getAttribute('width') || '0'),
		height: parseFloat(qrcodeElement.getAttribute('height') || '0'),
	};
};

/**
 * SVGコンテンツからBlobURLを生成
 * @param svgContent - SVGコンテンツ文字列
 * @returns Blob URL
 */
export const createSvgBlobUrl = (svgContent: string): string => {
	const blob = new Blob([svgContent], { type: 'image/svg+xml' });
	return URL.createObjectURL(blob);
};
