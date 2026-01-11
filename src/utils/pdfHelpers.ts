/**
 * PDF生成に関するユーティリティ関数
 */

import type jsPDF from 'jspdf';
import type { TemplateInfo, Ticket } from '../types';
import { PDF_CONFIG } from './constants';

/**
 * チケットのCanvasからPDFに画像を追加
 * @param pdf - jsPDFインスタンス
 * @param ticketElement - チケット要素のDOM
 * @param templateInfo - テンプレート情報
 * @param currentY - 現在のY座標（cm）
 * @returns 次のY座標（cm）、エラーの場合は現在のY座標
 */
export const addTicketToPDF = (pdf: jsPDF, ticketElement: Element, templateInfo: TemplateInfo, currentY: number): number => {
	// Canvasを持つ要素を探す
	const canvasElement = ticketElement.querySelector('canvas');
	if (!canvasElement) return currentY;

	// Canvasから画像を取得
	const imgData = canvasElement.toDataURL('image/png');

	// A4の幅に合わせてスケール
	const scaledWidth = Math.min(templateInfo.width, PDF_CONFIG.WIDTH - 1);
	const scaledHeight = (scaledWidth / templateInfo.width) * templateInfo.height;

	// ページに収まるかチェック
	const nextY = currentY + scaledHeight + PDF_CONFIG.TICKET_SPACING;
	if (nextY > PDF_CONFIG.HEIGHT - PDF_CONFIG.MARGIN_TOP) {
		// 次のページに
		pdf.addPage();
		const newY = PDF_CONFIG.MARGIN_TOP;

		// PDFに画像を追加
		const imgX = (PDF_CONFIG.WIDTH - scaledWidth) / 2; // 中央寄せ
		pdf.addImage(imgData, 'PNG', imgX, newY, scaledWidth, scaledHeight);

		// チケットの周りに極細線を描画（カットガイド）
		pdf.setLineWidth(PDF_CONFIG.CUT_LINE_WIDTH);
		pdf.setDrawColor(...PDF_CONFIG.CUT_LINE_COLOR);
		pdf.rect(imgX, newY, scaledWidth, scaledHeight);
		pdf.setLineWidth(0.2); // デフォルトに戻す

		return newY + scaledHeight + PDF_CONFIG.TICKET_SPACING;
	}

	// PDFに画像を追加
	const imgX = (PDF_CONFIG.WIDTH - scaledWidth) / 2; // 中央寄せ
	pdf.addImage(imgData, 'PNG', imgX, currentY, scaledWidth, scaledHeight);

	// チケットの周りに極細線を描画（カットガイド）
	pdf.setLineWidth(PDF_CONFIG.CUT_LINE_WIDTH);
	pdf.setDrawColor(...PDF_CONFIG.CUT_LINE_COLOR);
	pdf.rect(imgX, currentY, scaledWidth, scaledHeight);
	pdf.setLineWidth(0.2); // デフォルトに戻す

	return nextY;
};

/**
 * 複数チケットからPDFを生成（動的列数対応）
 * @param pdf - jsPDFインスタンス
 * @param tickets - チケット配列
 * @param templateMap - テンプレート情報のマップ (ID -> TemplateInfo)
 * @throws PDF生成に失敗した場合
 */
export const generateTicketsPDF = (pdf: jsPDF, tickets: Ticket[], templateMap: Map<string, TemplateInfo>): void => {
	const MARGIN_SIDE = 0.5; // 左右マージン (cm)

	let currentX = MARGIN_SIDE;
	let currentY = PDF_CONFIG.MARGIN_TOP;
	let maxHeightInRow = 0; // 現在の行の最大高さ

	// 各チケットのCanvasを取得してPDFに追加
	for (const ticket of tickets) {
		const templateInfo = templateMap.get(ticket.templateType);
		if (!templateInfo) continue;

		// data-ticket-id属性でチケット要素を特定
		const ticketElement = document.querySelector(`[data-ticket-id="${ticket.id}"]`);
		if (!ticketElement) continue;

		const canvasElement = ticketElement.querySelector('canvas');
		if (!canvasElement) continue;

		// Canvasから画像を取得
		const imgData = canvasElement.toDataURL('image/png');

		// チケットのサイズを計算（テンプレートの実サイズを使用）
		const scaledWidth = templateInfo.width;
		const scaledHeight = templateInfo.height;

		// 現在の行に収まるかチェック
		if (currentX + scaledWidth > PDF_CONFIG.WIDTH - MARGIN_SIDE) {
			// 次の行へ
			currentX = MARGIN_SIDE;
			currentY += maxHeightInRow + PDF_CONFIG.TICKET_SPACING;
			maxHeightInRow = 0;
		}

		// ページに収まるかチェック
		if (currentY + scaledHeight > PDF_CONFIG.HEIGHT - PDF_CONFIG.MARGIN_TOP) {
			// 新しいページに
			pdf.addPage();
			currentY = PDF_CONFIG.MARGIN_TOP;
			currentX = MARGIN_SIDE;
			maxHeightInRow = 0;
		}

		// PDFに画像を追加
		pdf.addImage(imgData, 'PNG', currentX, currentY, scaledWidth, scaledHeight);

		// チケットの周りに極細線を描画（カットガイド）
		pdf.setLineWidth(PDF_CONFIG.CUT_LINE_WIDTH);
		pdf.setDrawColor(...PDF_CONFIG.CUT_LINE_COLOR);
		pdf.rect(currentX, currentY, scaledWidth, scaledHeight);
		pdf.setLineWidth(0.2); // デフォルトに戻す

		// 現在の行の最大高さを更新
		maxHeightInRow = Math.max(maxHeightInRow, scaledHeight);

		// 次の位置へ（横方向に移動）
		currentX += scaledWidth + PDF_CONFIG.TICKET_SPACING;
	}
};
