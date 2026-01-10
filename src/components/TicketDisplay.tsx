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

// CSS準拠のスケール: 1cm = 96px / 2.54 ≈ 37.79527559px
const CANVAS_SCALE = 96 / 2.54;

export const TicketDisplay: React.FC<TicketDisplayProps> = ({ ticket, templatesWithSvg }) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	// テンプレート情報とSVG関連データをメモ化
	const { templateInfo, svgUrl, svgContent, textAreaBounds } = useMemo(() => {
		const template = templatesWithSvg.find((t) => t.id === ticket.templateType);
		if (!template) {
			return {
				templateInfo: null,
				svgUrl: '',
				svgContent: '',
				textAreaBounds: null,
			};
		}

		const blob = new Blob([template.svgContent], { type: 'image/svg+xml' });
		const url = URL.createObjectURL(blob);

		// SVGから編集可能エリアの情報を抽出
		const parser = new DOMParser();
		const svgDoc = parser.parseFromString(template.svgContent, 'image/svg+xml');
		const editableElement = svgDoc.querySelector('.editable.main');

		let bounds: TextAreaBounds | null = null;
		if (editableElement) {
			bounds = {
				x: parseFloat(editableElement.getAttribute('x') || '0'),
				y: parseFloat(editableElement.getAttribute('y') || '0'),
				width: parseFloat(editableElement.getAttribute('width') || '0'),
				height: parseFloat(editableElement.getAttribute('height') || '0'),
			};
		}

		return {
			templateInfo: template,
			svgUrl: url,
			svgContent: template.svgContent,
			textAreaBounds: bounds,
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
				const editableElement = svgDoc.querySelector('.editable.main');

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
		};
		svgImg.src = svgUrl;
	}, [svgUrl, svgContent, ticket.lines, textAreaBounds, templateInfo]);

	return (
		<div ref={containerRef} className={styles.container}>
			<canvas ref={canvasRef} className={styles.canvas} />
		</div>
	);
};
