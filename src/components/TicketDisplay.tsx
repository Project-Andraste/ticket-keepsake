import React, { useEffect, useRef, useState } from 'react';
import type { TemplateInfo, Ticket } from '../types';

interface TicketDisplayProps {
	ticket: Ticket;
}

interface TextAreaBounds {
	x: number;
	y: number;
	width: number;
	height: number;
}

// 1cm = 40pxのスケール
const CANVAS_SCALE = 40;

export const TicketDisplay: React.FC<TicketDisplayProps> = ({ ticket }) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const [svgUrl, setSvgUrl] = useState<string>('');
	const [svgContent, setSvgContent] = useState<string>('');
	const [textAreaBounds, setTextAreaBounds] = useState<TextAreaBounds | null>(null);
	const [templateInfo, setTemplateInfo] = useState<TemplateInfo | null>(null);

	// テンプレート情報を読み込み
	useEffect(() => {
		const loadTemplateInfo = async () => {
			try {
				const response = await fetch('/templates.json');
				const templates: TemplateInfo[] = await response.json();
				const template = templates.find((t) => t.id === ticket.templateType);
				setTemplateInfo(template || null);
			} catch (error) {
				console.error('Failed to load template info:', error);
			}
		};
		loadTemplateInfo();
	}, [ticket.templateType]);

	// SVGテンプレートを読み込み
	useEffect(() => {
		if (!templateInfo) return;

		const loadSVG = async () => {
			try {
				const response = await fetch(templateInfo.svgPath);
				const svg = await response.text();
				setSvgContent(svg);

				const blob = new Blob([svg], { type: 'image/svg+xml' });
				setSvgUrl(URL.createObjectURL(blob));

				// SVGから編集可能エリアの情報を抽出
				const parser = new DOMParser();
				const svgDoc = parser.parseFromString(svg, 'image/svg+xml');
				const editableElement = svgDoc.querySelector('.editable.main');

				if (editableElement) {
					// transform属性を確認
					const transform = editableElement.getAttribute('transform');

					if (transform && transform.includes('rotate(90)')) {
						// rotate(90)の場合、座標を変換
						const origX = parseFloat(editableElement.getAttribute('x') || '0');
						const origY = parseFloat(editableElement.getAttribute('y') || '0');
						const origWidth = parseFloat(editableElement.getAttribute('width') || '0');
						const origHeight = parseFloat(editableElement.getAttribute('height') || '0');

						// rotate(90)後の実座標を計算
						setTextAreaBounds({
							x: -origY - origWidth,
							y: origX,
							width: origHeight,
							height: origWidth,
						});
					} else {
						// 通常のrect要素
						setTextAreaBounds({
							x: parseFloat(editableElement.getAttribute('x') || '0'),
							y: parseFloat(editableElement.getAttribute('y') || '0'),
							width: parseFloat(editableElement.getAttribute('width') || '0'),
							height: parseFloat(editableElement.getAttribute('height') || '0'),
						});
					}
				}
			} catch (error) {
				console.error('Failed to load SVG:', error);
			}
		};

		loadSVG();

		return () => {
			setSvgUrl('');
			setSvgContent('');
		};
	}, [templateInfo]);

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

				// パディング設定（cm単位からピクセルに変換）
				const paddingTop = 0.1 * CANVAS_SCALE;
				const paddingLeft = 0.2 * CANVAS_SCALE;
				const paddingRight = 0.2 * CANVAS_SCALE;
				const lineSpacing = 0.1 * CANVAS_SCALE;

				// 各行のテキストを描画
				let currentY = textAreaTop + paddingTop;

				ticket.lines.forEach((line) => {
					if (!ctx || !line.text) return;

					// フォント設定
					const fontSize = Math.max(8, line.fontSize);
					ctx.font = `${line.bold ? 'bold ' : ''}${fontSize}px ${fontFamily}`;

					// テキスト幅を計算
					const textMetrics = ctx.measureText(line.text);
					const textWidth = textMetrics.width;

					// 描画可能幅（パディングを考慮）
					const availableWidth = textAreaWidth - paddingLeft - paddingRight;

					// x位置を計算（寄せに応じて）
					let x = textAreaLeft + paddingLeft; // デフォルトは左寄せ
					if (line.align === 'center') {
						x = textAreaLeft + paddingLeft + (availableWidth - textWidth) / 2;
					} else if (line.align === 'right') {
						x = textAreaRight - paddingRight - textWidth;
					}

					// 領域内に収まるかチェック
					if (currentY + fontSize <= textAreaBottom) {
						// テキスト描画（textBaseline='top'なのでcurrentYが文字の上端）
						ctx.fillText(line.text, x, currentY);
					}

					// 次の行のy位置を計算（フォントサイズ + 行間）
					currentY += fontSize + lineSpacing;
				});
			}
		};
		svgImg.src = svgUrl;
	}, [svgUrl, svgContent, ticket.lines, textAreaBounds, templateInfo]);

	return (
		<div ref={containerRef} style={styles.container}>
			<canvas ref={canvasRef} style={styles.canvas} />
		</div>
	);
};

const styles = {
	container: {
		border: '1px solid #ddd',
		borderRadius: '4px',
		padding: '1rem',
		backgroundColor: '#f9f9f9',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		minHeight: '250px',
	} as React.CSSProperties,
	canvas: {
		maxWidth: '100%',
		height: 'auto',
		boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
	} as React.CSSProperties,
};
