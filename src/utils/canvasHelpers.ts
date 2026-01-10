/**
 * Canvas描画に関するユーティリティ関数
 */

import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import type { BarcodeBounds, BarcodeOptions, QrcodeBounds } from '../types';
import { BARCODE_CONFIG, CANVAS_SCALE, QRCODE_CONFIG } from './constants';

/**
 * バーコードをCanvasに描画
 * @param ctx - Canvas描画コンテキスト
 * @param bounds - バーコード領域の境界情報
 * @param value - バーコード値
 * @param barcodeOptions - バーコード生成オプション
 */
export const drawBarcodeToCanvas = (ctx: CanvasRenderingContext2D, bounds: BarcodeBounds, value: string, barcodeOptions?: BarcodeOptions): void => {
	if (!value.trim()) return;

	ctx.save();

	// 回転の中心は原点(0,0)なので、SVGと同じ変換を適用
	const radians = (bounds.rotation * Math.PI) / 180;
	ctx.rotate(radians);

	// スケール適用後の座標
	const barcodeX = bounds.x * CANVAS_SCALE;
	const barcodeY = bounds.y * CANVAS_SCALE;
	const barcodeWidth = bounds.width * CANVAS_SCALE;
	const barcodeHeight = bounds.height * CANVAS_SCALE;

	// 一時的なCanvasを使ってバーコード画像を生成
	const tempCanvas = document.createElement('canvas');
	try {
		// BarcodeOptionsをRecord<string, unknown>に変換
		const barcodeOpts = (barcodeOptions || {}) as Record<string, unknown>;

		// Canvas解像度倍率を計算（基準スケールからの倍率）
		const scaleMultiplier = CANVAS_SCALE / (96 / 2.54);

		JsBarcode(tempCanvas, value, {
			...barcodeOpts,
			// 以下は固定値（上書き不可）
			format: BARCODE_CONFIG.FORMAT,
			text: value,
			height: barcodeHeight,
			displayValue: BARCODE_CONFIG.DISPLAY_VALUE,
			margin: BARCODE_CONFIG.MARGIN,
			width: ((barcodeOpts.width as number) ?? 2) * scaleMultiplier, // バーの幅も倍率に応じて調整
		});

		// 生成されたバーコード画像のサイズ
		const generatedWidth = tempCanvas.width;
		const generatedHeight = tempCanvas.height;

		// 横幅を8割使うことを優先しつつ、縦方向は矩形に収まる範囲で調整
		const scaleX = (barcodeWidth * BARCODE_CONFIG.WIDTH_RATIO) / generatedWidth;
		const scaleY = barcodeHeight / generatedHeight;
		const scale = Math.min(scaleX, scaleY);

		// スケール後のサイズ
		const scaledWidth = generatedWidth * scale;
		const scaledHeight = generatedHeight * scale;

		// 中央配置のための座標計算
		const centerX = barcodeX + (barcodeWidth - scaledWidth) / 2;
		const centerY = barcodeY + (barcodeHeight - scaledHeight) / 2;

		// 生成されたバーコード画像を中央に描画
		ctx.drawImage(tempCanvas, centerX, centerY, scaledWidth, scaledHeight);
	} catch (error) {
		console.error('バーコード生成エラー:', error);
		// エラーの場合は何も表示しない
	}

	ctx.restore();
};

/**
 * QRコードをCanvasに描画（非同期）
 * @param ctx - Canvas描画コンテキスト
 * @param bounds - QRコード領域の境界情報
 * @param value - QRコード値
 */
export const drawQRCodeToCanvas = async (ctx: CanvasRenderingContext2D, bounds: QrcodeBounds, value: string): Promise<void> => {
	if (!value.trim()) return;

	const qrcodeX = bounds.x * CANVAS_SCALE;
	const qrcodeY = bounds.y * CANVAS_SCALE;
	const qrcodeWidth = bounds.width * CANVAS_SCALE;
	const qrcodeHeight = bounds.height * CANVAS_SCALE;

	// QRコードのサイズは正方形なので、小さい方を採用
	const qrcodeSize = Math.min(qrcodeWidth, qrcodeHeight);

	// 一時的なCanvasを使ってQRコード画像を生成
	const tempCanvas = document.createElement('canvas');
	try {
		await QRCode.toCanvas(tempCanvas, value, {
			width: qrcodeSize,
			margin: QRCODE_CONFIG.MARGIN,
			errorCorrectionLevel: QRCODE_CONFIG.ERROR_CORRECTION_LEVEL,
		});

		// 中央配置のための座標計算
		const centerX = qrcodeX + (qrcodeWidth - qrcodeSize) / 2;
		const centerY = qrcodeY + (qrcodeHeight - qrcodeSize) / 2;

		// 生成されたQRコード画像を中央に描画
		ctx.drawImage(tempCanvas, centerX, centerY, qrcodeSize, qrcodeSize);
	} catch (error) {
		console.error('QRコード生成エラー:', error);
		// エラーの場合は何も表示しない
	}
};
