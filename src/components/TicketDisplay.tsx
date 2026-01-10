import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import React, { useEffect, useMemo, useRef } from 'react';
import type { TemplateWithSvg, Ticket } from '../types';
import styles from './TicketDisplay.module.css';

interface TicketDisplayProps {
	ticket: Ticket;
	templatesWithSvg: TemplateWithSvg[];
}

interface TextAreaBounds {
	x: number;
	y: number;
	width: number;
	height: number;
}

interface BarcodeBounds {
	x: number;
	y: number;
	width: number;
	height: number;
	rotation: number; // 回転角度（度）
}

interface QrcodeBounds {
	x: number;
	y: number;
	width: number;
	height: number;
}

// CSS準拠のスケール: 1cm = 96px / 2.54 ≈ 37.79527559px
const CANVAS_SCALE = 96 / 2.54;

export const TicketDisplay: React.FC<TicketDisplayProps> = ({ ticket, templatesWithSvg }) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	// テンプレート情報とSVG関連データをメモ化
	const { templateInfo, svgUrl, svgContent, textAreaBounds, barcodeBounds, qrcodeBounds, editableOrder } = useMemo(() => {
		const template = templatesWithSvg.find((t) => t.id === ticket.templateType);
		if (!template) {
			return {
				templateInfo: null,
				svgUrl: '',
				svgContent: '',
				textAreaBounds: null,
				barcodeBounds: null,
				qrcodeBounds: null,
				editableOrder: [],
			};
		}

		const blob = new Blob([template.svgContent], { type: 'image/svg+xml' });
		const url = URL.createObjectURL(blob);

		// SVGから編集可能エリアの情報を抽出
		const parser = new DOMParser();
		const svgDoc = parser.parseFromString(template.svgContent, 'image/svg+xml');

		// SVG内の.editable要素の順序を取得
		const editableElements = Array.from(svgDoc.querySelectorAll('.editable'));
		const order: string[] = [];
		editableElements.forEach((el) => {
			if (el.classList.contains('barcode')) order.push('barcode');
			else if (el.classList.contains('qrcode')) order.push('qrcode');
			else if (el.classList.contains('text')) order.push('text');
		});

		const editableElement = svgDoc.querySelector('.editable.text');

		let bounds: TextAreaBounds | null = null;
		if (editableElement) {
			bounds = {
				x: parseFloat(editableElement.getAttribute('x') || '0'),
				y: parseFloat(editableElement.getAttribute('y') || '0'),
				width: parseFloat(editableElement.getAttribute('width') || '0'),
				height: parseFloat(editableElement.getAttribute('height') || '0'),
			};
		}

		// バーコード領域の情報を抽出
		const barcodeElement = svgDoc.querySelector('.editable.barcode');
		let barcBounds: BarcodeBounds | null = null;
		if (barcodeElement) {
			const transform = barcodeElement.getAttribute('transform') || '';
			const rotateMatch = transform.match(/rotate\((-?\d+(?:\.\d+)?)\)/);
			const rotation = rotateMatch ? parseFloat(rotateMatch[1]) : 0;

			barcBounds = {
				x: parseFloat(barcodeElement.getAttribute('x') || '0'),
				y: parseFloat(barcodeElement.getAttribute('y') || '0'),
				width: parseFloat(barcodeElement.getAttribute('width') || '0'),
				height: parseFloat(barcodeElement.getAttribute('height') || '0'),
				rotation,
			};
		}

		// QRコード領域の情報を抽出
		const qrcodeElement = svgDoc.querySelector('.editable.qrcode');
		let qrBounds: QrcodeBounds | null = null;
		if (qrcodeElement) {
			qrBounds = {
				x: parseFloat(qrcodeElement.getAttribute('x') || '0'),
				y: parseFloat(qrcodeElement.getAttribute('y') || '0'),
				width: parseFloat(qrcodeElement.getAttribute('width') || '0'),
				height: parseFloat(qrcodeElement.getAttribute('height') || '0'),
			};
		}

		return {
			templateInfo: template,
			svgUrl: url,
			svgContent: template.svgContent,
			textAreaBounds: bounds,
			barcodeBounds: barcBounds,
			qrcodeBounds: qrBounds,
			editableOrder: order,
		};
	}, [ticket.templateType, templatesWithSvg]);

	// Canvasにチケットを描画
	useEffect(() => {
		if (!canvasRef.current || !svgUrl || !templateInfo) return;

		const canvas = canvasRef.current;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const svgImg = new Image();
		svgImg.onload = () => {
			// テンプレート情報からサイズを取得
			const ticketWidth = templateInfo.width * CANVAS_SCALE;
			const ticketHeight = templateInfo.height * CANVAS_SCALE;

			canvas.width = ticketWidth;
			canvas.height = ticketHeight;

			// SVG背景を描画
			ctx.drawImage(svgImg, 0, 0, ticketWidth, ticketHeight);

			// テキスト領域の情報が取得できていない場合は、SVGから再度取得
			let bounds = textAreaBounds;
			if (!bounds && svgContent) {
				const parser = new DOMParser();
				const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
				const editableElement = svgDoc.querySelector('.editable.text');

				if (editableElement) {
					// rect要素の座標を直接取得
					bounds = {
						x: parseFloat(editableElement.getAttribute('x') || '0'),
						y: parseFloat(editableElement.getAttribute('y') || '0'),
						width: parseFloat(editableElement.getAttribute('width') || '0'),
						height: parseFloat(editableElement.getAttribute('height') || '0'),
					};
				}
			}

			// フォント設定
			const fontFamily = "'Noto Sans JP', sans-serif";
			ctx.fillStyle = '#000';
			ctx.textBaseline = 'top'; // ベースラインを上揃えに設定

			// テキスト領域が取得できた場合、その範囲内に描画
			if (bounds) {
				const textAreaLeft = bounds.x * CANVAS_SCALE;
				const textAreaTop = bounds.y * CANVAS_SCALE;
				const textAreaRight = (bounds.x + bounds.width) * CANVAS_SCALE;
				const textAreaBottom = (bounds.y + bounds.height) * CANVAS_SCALE;
				const textAreaWidth = bounds.width * CANVAS_SCALE;

				// 行間は基本0（間隔はmarginTop/marginBottomで調整）
				const lineSpacing = 0;

				// 各行のテキストを描画
				let currentY = textAreaTop;

				ticket.lines.forEach((line) => {
					if (!ctx) return;
					// マージン設定（上/下/左右）。未設定は0cm（左右は少し余白がある場合は必要に応じて変更）
					const marginTop = (line.marginTop ?? 0) * CANVAS_SCALE;
					const marginBottom = (line.marginBottom ?? 0) * CANVAS_SCALE;
					const marginLeft = (line.marginLeft ?? 0.2) * CANVAS_SCALE;
					const marginRight = (line.marginRight ?? 0.2) * CANVAS_SCALE;

					// フォント設定
					const fontSize = Math.max(8, line.fontSize);
					ctx.font = `${line.bold ? 'bold ' : ''}${fontSize}px ${fontFamily}`;

					// y位置は現在の基準に「上余白」を加算
					const y = currentY + marginTop;

					// テキストがある場合のみ描画
					if (line.text) {
						// 描画可能幅（マージンを考慮）
						const availableWidth = textAreaWidth - marginLeft - marginRight;

						// テキスト幅を計算
						const textMetrics = ctx.measureText(line.text);
						const textWidth = textMetrics.width;

						// x位置を計算（寄せに応じて）
						let x = textAreaLeft + marginLeft; // デフォルトは左寄せ
						if (line.align === 'center') {
							x = textAreaLeft + marginLeft + (availableWidth - textWidth) / 2;
						} else if (line.align === 'right') {
							x = textAreaRight - marginRight - textWidth;
						}

						// 領域内に収まるかチェック
						if (y + fontSize <= textAreaBottom) {
							// テキスト描画（textBaseline='top'なのでyが文字の上端）
							ctx.fillText(line.text, x, y);
						}
					}

					// 次の行の基準位置を計算：今回のy + 文字高 + 下余白 + 行間
					// 空行でも行の高さを保持する
					currentY = y + fontSize + marginBottom + lineSpacing;
				});
			}

			// SVGの要素順序に従って描画関数を定義
			const drawBarcode = () => {
				if (!barcodeBounds || !ticket.barcode || !ticket.barcode.trim()) return;

				ctx.save();

				// 回転の中心は原点(0,0)なので、SVGと同じ変換を適用
				const radians = (barcodeBounds.rotation * Math.PI) / 180;
				ctx.rotate(radians);

				// スケール適用後の座標
				const barcodeX = barcodeBounds.x * CANVAS_SCALE;
				const barcodeY = barcodeBounds.y * CANVAS_SCALE;
				const barcodeWidth = barcodeBounds.width * CANVAS_SCALE;
				const barcodeHeight = barcodeBounds.height * CANVAS_SCALE;

				// 一時的なCanvasを使ってバーコード画像を生成
				const tempCanvas = document.createElement('canvas');
				try {
					// テンプレートのバーコードオプションを取得（デフォルト値あり）
					const barcodeOpts = templateInfo.barcodeOptions || {};

					JsBarcode(tempCanvas, ticket.barcode, {
						...barcodeOpts,
						// 以下は固定値（上書き不可）
						format: 'CODE128',
						text: ticket.barcode,
						height: barcodeHeight,
						displayValue: true,
						margin: 0,
					});

					// 生成されたバーコード画像のサイズ
					const generatedWidth = tempCanvas.width;
					const generatedHeight = tempCanvas.height;

					// 横幅を8割使うことを優先しつつ、縦方向は矩形に収まる範囲で調整
					const scaleX = (barcodeWidth * 0.8) / generatedWidth;
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
					// エラーの場合は赤い枠を表示
					ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
					ctx.lineWidth = 2;
					ctx.strokeRect(barcodeX, barcodeY, barcodeWidth, barcodeHeight);
				}

				ctx.restore();
			};

			const drawQRCode = async () => {
				if (!qrcodeBounds || !ticket.qrcode || !ticket.qrcode.trim()) return;

				const qrcodeX = qrcodeBounds.x * CANVAS_SCALE;
				const qrcodeY = qrcodeBounds.y * CANVAS_SCALE;
				const qrcodeWidth = qrcodeBounds.width * CANVAS_SCALE;
				const qrcodeHeight = qrcodeBounds.height * CANVAS_SCALE;

				// QRコードのサイズは正方形なので、小さい方を採用
				const qrcodeSize = Math.min(qrcodeWidth, qrcodeHeight);

				// 一時的なCanvasを使ってQRコード画像を生成
				const tempCanvas = document.createElement('canvas');
				try {
					await QRCode.toCanvas(tempCanvas, ticket.qrcode, {
						width: qrcodeSize,
						margin: 0,
						errorCorrectionLevel: 'M',
					});

					// 中央配置のための座標計算
					const centerX = qrcodeX + (qrcodeWidth - qrcodeSize) / 2;
					const centerY = qrcodeY + (qrcodeHeight - qrcodeSize) / 2;

					// 生成されたQRコード画像を中央に描画
					ctx.drawImage(tempCanvas, centerX, centerY, qrcodeSize, qrcodeSize);
				} catch (error) {
					console.error('QRコード生成エラー:', error);
					// エラーの場合は赤い枠を表示
					ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
					ctx.lineWidth = 2;
					ctx.strokeRect(qrcodeX, qrcodeY, qrcodeWidth, qrcodeHeight);
				}
			};

			// SVGの要素順序に従って描画（非同期処理を順次実行）
			const drawInOrder = async () => {
				for (const type of editableOrder) {
					if (type === 'barcode') drawBarcode();
					else if (type === 'qrcode') await drawQRCode();
				}
			};

			drawInOrder();
		};
		svgImg.src = svgUrl;
	}, [svgUrl, svgContent, ticket.lines, ticket.barcode, ticket.qrcode, textAreaBounds, barcodeBounds, qrcodeBounds, editableOrder, templateInfo]);

	return (
		<div ref={containerRef} className={styles.container}>
			<canvas ref={canvasRef} className={styles.canvas} />
		</div>
	);
};
