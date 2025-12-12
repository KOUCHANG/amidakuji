// Build info (auto-updated by GitHub Actions)
const BUILD_INFO = {
    version: '2025.12.12-1223',
    buildDate: '2025-12-12 21:23:15 +0900',
    commit: 'f81b4a7'
};

let participants = [];
let results = [];
let shuffledResults = []; // ランダムに配置された結果
let horizontalLines = [];
let canvas, ctx;
let addLineMode = false;
let addablePositions = [];
let resultViewMode = false; // 結果モード：道順を見るモード
let currentBackgroundColor = null; // 現在の背景色を記録
let revealedPaths = []; // アニメーションされた参加者と結果のペアを記録
let highlightColors = []; // 星マーク用の色パレット（動的生成）

// 識別しやすい背景色のパレット（グラデーション用の色ペア）
const backgroundColors = [
    ['#667eea', '#764ba2'], // パープル（デフォルト）
    ['#f093fb', '#f5576c'], // ピンク→レッド
    ['#4facfe', '#00f2fe'], // ブルー
    ['#43e97b', '#38f9d7'], // グリーン→シアン
    ['#fa709a', '#fee140'], // ピンク→イエロー
    ['#30cfd0', '#330867'], // シアン→ディープパープル
    ['#a8edea', '#fed6e3'], // ライトシアン→ライトピンク
    ['#ff9a56', '#fecb6e'], // オレンジ
    ['#ff6e7f', '#bfe9ff'], // レッド→ライトブルー
    ['#ffecd2', '#fcb69f']  // クリーム→オレンジ
];

let config = {
    lineWidth: 3,
    verticalLineColor: '#333',
    horizontalLineColor: '#667eea',
    highlightColor: '#ff6b6b',
    participantColor: '#2c3e50',
    resultColor: '#27ae60',
    padding: 60,
    verticalSpacing: 120,
    horizontalSpacing: 40,
    animationSpeed: 2.0
};

// バージョン情報をコンソールに出力
console.log('%c🎯 あみだくじ', 'font-size: 20px; font-weight: bold; color: #667eea;');
console.log(`%cVersion: ${BUILD_INFO.version}`, 'color: #27ae60; font-weight: bold;');
console.log(`%cBuild Date: ${BUILD_INFO.buildDate}`, 'color: #27ae60;');
console.log(`%cCommit: ${BUILD_INFO.commit}`, 'color: #27ae60;');

// 景品の数に応じて最も離れた色を生成
function generateDistinctColors(count) {
    const colors = [];
    for (let i = 0; i < count; i++) {
        // 色相を360度で均等に分割
        const hue = (i * 360 / count) % 360;
        // 彩度を高め、明度を適度に設定（見やすい色に）
        const saturation = 70; // 70%
        const lightness = 50;  // 50%
        colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
    }
    return colors;
}

function updateAmidakuji() {
    const resultInput = document.getElementById('results').value.trim();
    
    if (!resultInput) {
        alert('結果/景品を入力してください。');
        return;
    }
    
    // 改行区切りをメインとし、1行のみの場合はスペース区切りも試す
    results = resultInput.split('\n').map(r => r.trim()).filter(r => r);
    if (results.length === 1 && results[0].includes(' ')) {
        results = results[0].split(/\s+/).filter(r => r);
    }
    
    if (results.length < 2) {
        alert('結果は2つ以上必要です。');
        return;
    }
    
    // 参加者数を結果の数に合わせる
    const numParticipants = results.length;
    
    // 既存の参加者名を保持しつつ、不足分は追加（空文字列で初期化）
    if (participants.length < numParticipants) {
        for (let i = participants.length; i < numParticipants; i++) {
            participants.push('');
        }
    } else if (participants.length > numParticipants) {
        // 余分な参加者を削除
        participants = participants.slice(0, numParticipants);
    }
    
    // 横線をクリア（参加者数が変わった場合に備えて）
    horizontalLines = [];
    
    // 囲み情報をクリア
    revealedPaths = [];
    
    // 結果をランダムにシャッフル
    shuffledResults = [...results].sort(() => Math.random() - 0.5);
    
    // 景品の数に応じて最も離れた色を生成
    highlightColors = generateDistinctColors(numParticipants);
    
    // 背景色をランダムに変更（前回と異なる色を選択）
    changeBackgroundColor();
    
    // 参加者入力フィールドを作成
    createNameInputs();
    
    drawAmidakuji();
    
    // 初回作成時：メインコンテンツと設定ボタンを表示
    const mainContainer = document.getElementById('mainContainer');
    const settingsBtn = document.getElementById('settingsBtn');
    if (mainContainer) mainContainer.style.display = 'flex';
    if (settingsBtn) settingsBtn.style.display = 'block';
    
    // モーダルのタイトルとボタンを更新
    const modalTitle = document.getElementById('modalTitle');
    const createBtn = document.getElementById('createBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    
    if (modalTitle) modalTitle.textContent = '結果/景品の設定';
    if (createBtn) createBtn.textContent = 'あみだくじを更新';
    if (closeModalBtn) closeModalBtn.style.display = 'flex';
    
    // モーダルを閉じる
    closeSettings();
}

// 参加者名をテキストエリアから読み取り
// 参加者名を個別入力から読み取り
function updateParticipantFromInput(index) {
    const input = document.getElementById(`participant-${index}`);
    if (input) {
        participants[index] = input.value.trim() || '';
        drawAmidakuji();
    }
}

// 丸つき数字を生成
function getCircledNumber(num) {
    // 丸つき数字 ①-⑳
    const circledNumbers = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩',
                           '⑪', '⑫', '⑬', '⑭', '⑮', '⑯', '⑰', '⑱', '⑲', '⑳'];
    if (num > 0 && num <= circledNumbers.length) {
        return circledNumbers[num - 1];
    }
    return `(${num})`;
}

// 個別入力フィールドを作成
function createNameInputs() {
    const container = document.getElementById('participantInputs');
    if (!container) return;
    
    container.innerHTML = '';
    
    for (let i = 0; i < participants.length; i++) {
        const row = document.createElement('div');
        row.className = 'participant-input-row';
        
        // 丸つき数字
        const numberSpan = document.createElement('span');
        numberSpan.className = 'participant-number';
        numberSpan.textContent = getCircledNumber(i + 1);
        
        // 入力フィールド
        const input = document.createElement('input');
        input.type = 'text';
        input.id = `participant-${i}`;
        input.value = participants[i];
        input.placeholder = `参加者${i + 1}`;
        input.addEventListener('input', () => updateParticipantFromInput(i));
        
        row.appendChild(numberSpan);
        row.appendChild(input);
        container.appendChild(row);
    }
}

// Canvasのイベントリスナを初期化
function initCanvasEvents() {
    const canvas = document.getElementById('amidakujiCanvas');
    if (canvas) {
        // クリックイベント
        canvas.addEventListener('click', handleCanvasClick);
        
        // タッチイベント
        canvas.addEventListener('touchstart', handleCanvasTouch, { passive: false });
    }
}

// ページ読み込み時に初期化
window.addEventListener('DOMContentLoaded', () => {
    initCanvasEvents();
});

function clearLines() {
    horizontalLines = [];
    drawAmidakuji();
}

function generateHorizontalLines(count) {
    horizontalLines = [];
    const numPaths = participants.length;
    const maxHeight = config.horizontalSpacing * (count + 2);
    
    for (let i = 0; i < count; i++) {
        const y = config.padding + config.horizontalSpacing * (i + 1);
        const startColumn = Math.floor(Math.random() * (numPaths - 1));
        
        // 同じ高さに複数の線が重ならないように
        let attempts = 0;
        let validLine = false;
        let column = startColumn;
        
        while (!validLine && attempts < 10) {
            validLine = true;
            for (let line of horizontalLines) {
                if (Math.abs(line.y - y) < config.horizontalSpacing * 0.3 && line.column === column) {
                    validLine = false;
                    column = Math.floor(Math.random() * (numPaths - 1));
                    break;
                }
            }
            attempts++;
        }
        
        if (validLine) {
            horizontalLines.push({ y, column });
        }
    }
    
    horizontalLines.sort((a, b) => a.y - b.y);
}

function calculateAddablePositions() {
    addablePositions = [];
    const numPaths = participants.length;
    const totalHeight = canvas.height - config.padding * 2;
    const spacing = 50; // 等間隔の間隔(ピクセル)
    const offset = spacing / 2; // 偶数列のオフセット
    
    // まず全ての位置を生成
    let tempPositions = [];
    for (let col = 0; col < numPaths - 1; col++) {
        const startY = config.padding + spacing + (col % 2 === 0 ? 0 : offset);
        for (let y = startY; y < canvas.height - config.padding; y += spacing) {
            // 段番号を計算（offset考慮で正規化）
            const normalizedY = col % 2 === 0 ? y : y - offset;
            const row = Math.round((normalizedY - config.padding) / spacing);
            tempPositions.push({ y, column: col, row });
        }
    }
    
    // 段番号→列番号の順でソート
    tempPositions.sort((a, b) => {
        if (a.row !== b.row) {
            return a.row - b.row;
        }
        return a.column - b.column;
    });
    
    // ソート後にidを振り直す（1列目、2列目、3列目...の順）
    addablePositions = tempPositions.map((pos, index) => ({
        y: pos.y,
        column: pos.column,
        id: index
    }));
}

function drawAmidakuji() {
    canvas = document.getElementById('amidakujiCanvas');
    ctx = canvas.getContext('2d');
    
    const numPaths = participants.length;
    const canvasWidth = config.padding * 2 + config.verticalSpacing * (numPaths - 1);
    
    // 結果テキストの最大行数を計算（仮測定）
    ctx.font = 'bold 14px sans-serif';
    const maxWidth = config.verticalSpacing - 20;
    let maxResultLines = 1;
    for (let result of shuffledResults) {
        const lines = calculateTextLines(result, maxWidth);
        maxResultLines = Math.max(maxResultLines, lines.length);
    }
    
    // 結果テキストの高さを考慮（1行あたり20px + 上部余白30px）
    const resultTextHeight = maxResultLines * 20 + 30;
    
    const maxY = Math.max(
        config.horizontalSpacing * (horizontalLines.length + 2),
        400 // 最小の高さ
    );
    const canvasHeight = config.padding * 2 + maxY + resultTextHeight;
    
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 参加者名を上部に描画
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    
    for (let i = 0; i < numPaths; i++) {
        const x = config.padding + i * config.verticalSpacing;
        const name = participants[i] || '';
        
        if (name.trim()) {
            // 名前が入力されている場合
            ctx.fillStyle = config.participantColor;
            const displayName = name.length > 5 ? name.substring(0, 4) + '...' : name;
            ctx.fillText(displayName, x, config.padding - 15);
        } else {
            // 未入力の場合は丸つき数字を表示
            ctx.fillStyle = '#667eea';
            ctx.fillText(getCircledNumber(i + 1), x, config.padding - 15);
        }
    }
    
    // 縦線を描画
    ctx.strokeStyle = config.verticalLineColor;
    ctx.lineWidth = config.lineWidth;
    
    for (let i = 0; i < numPaths; i++) {
        const x = config.padding + i * config.verticalSpacing;
        ctx.beginPath();
        ctx.moveTo(x, config.padding);
        ctx.lineTo(x, canvas.height - config.padding);
        ctx.stroke();
    }
    
    // 横線を描画
    ctx.strokeStyle = config.horizontalLineColor;
    for (let line of horizontalLines) {
        const x1 = config.padding + line.column * config.verticalSpacing;
        const x2 = x1 + config.verticalSpacing;
        
        ctx.beginPath();
        ctx.moveTo(x1, line.y);
        ctx.lineTo(x2, line.y);
        ctx.stroke();
    }
    
    // キャンバスのサイズが確定した後に追加可能位置を計算
    calculateAddablePositions();
    
    // 追加モードの場合、追加可能な位置に数字を表示
    if (addLineMode) {
        drawAddablePositions();
    }
    
    // 結果モード中は結果を表示
    if (resultViewMode) {
        showAllResults();
    }
    
    // アニメーション済みの参加者と結果を囲む
    drawRevealedHighlights();
}

function drawAddablePositions() {
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    for (let pos of addablePositions) {
        // 既存の横線と重なっていないかチェック
        const tooClose = horizontalLines.some(line => 
            Math.abs(line.y - pos.y) < 25 && line.column === pos.column
        );
        
        if (!tooClose) {
            const x = config.padding + pos.column * config.verticalSpacing + config.verticalSpacing / 2;
            
            // 背景円を描画
            ctx.fillStyle = 'rgba(102, 126, 234, 0.1)';
            ctx.beginPath();
            ctx.arc(x, pos.y, 15, 0, Math.PI * 2);
            ctx.fill();
            
            // 枠線を描画
            ctx.strokeStyle = 'rgba(102, 126, 234, 0.5)';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // 番号を描画
            ctx.fillStyle = '#667eea';
            ctx.fillText((pos.id % 99 + 1).toString(), x, pos.y);
        }
    }
}

function drawRevealedHighlights() {
    // アニメーション済みの参加者と結果に星マークを表示
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    for (let revealed of revealedPaths) {
        const participantIndex = revealed.participantIndex;
        const resultIndex = revealed.resultIndex;
        const color = highlightColors[participantIndex % highlightColors.length];
        
        // 参加者の線の上部（縦線の開始位置）に★を表示
        const participantX = config.padding + participantIndex * config.verticalSpacing;
        const participantY = config.padding;
        
        ctx.fillStyle = color;
        ctx.fillText('★', participantX, participantY);
        
        // 結果の線の下部（縦線の終了位置）に★を表示
        const resultX = config.padding + resultIndex * config.verticalSpacing;
        const resultY = canvas.height - config.padding;
        
        ctx.fillStyle = color;
        ctx.fillText('★', resultX, resultY);
    }
}

function handleCanvasClick(event) {
    const canvas = document.getElementById('amidakujiCanvas');
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;
    
    processCanvasInteraction(x, y);
}

function handleCanvasTouch(event) {
    const canvas = document.getElementById('amidakujiCanvas');
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const touch = event.touches[0] || event.changedTouches[0];
    const x = (touch.clientX - rect.left) * scaleX;
    const y = (touch.clientY - rect.top) * scaleY;
    
    // タップ対象がある場合のみスクロールを防ぐ
    const shouldPreventDefault = checkIfInteractionNeeded(x, y);
    if (shouldPreventDefault) {
        event.preventDefault();
        event.stopPropagation();
        processCanvasInteraction(x, y);
    }
}

function checkIfInteractionNeeded(x, y) {
    // 追加モードの場合、追加可能な位置の近くかチェック
    if (addLineMode) {
        for (let pos of addablePositions) {
            const posX = config.padding + pos.column * config.verticalSpacing + config.verticalSpacing / 2;
            const distance = Math.sqrt(Math.pow(x - posX, 2) + Math.pow(y - pos.y, 2));
            if (distance < 30) {
                return true;
            }
        }
    }
    
    // 結果モードの場合、参加者名の位置近くかチェック
    if (resultViewMode) {
        for (let i = 0; i < participants.length; i++) {
            const pathX = config.padding + i * config.verticalSpacing;
            if (Math.abs(x - pathX) < 40 && y < config.padding + 20) {
                return true;
            }
        }
    }
    
    return false;
}

function processCanvasInteraction(x, y) {
    
    if (addLineMode) {
        // 追加可能な位置がクリックされたかチェック
        for (let pos of addablePositions) {
            const posX = config.padding + pos.column * config.verticalSpacing + config.verticalSpacing / 2;
            const distance = Math.sqrt(Math.pow(x - posX, 2) + Math.pow(y - pos.y, 2));
            
            // スマホでタップしやすいように判定範囲を広げる
            if (distance < 30) {
                // 既存の横線と重なっていないかチェック
                const tooClose = horizontalLines.some(line => 
                    Math.abs(line.y - pos.y) < 25 && line.column === pos.column
                );
                
                if (!tooClose) {
                    // 横線を追加
                    horizontalLines.push({ y: pos.y, column: pos.column });
                    horizontalLines.sort((a, b) => a.y - b.y);
                    drawAmidakuji();
                }
                return;
            }
        }
    }
    
    // 結果モードの場合、参加者名をクリックして道順表示
    if (resultViewMode) {
        for (let i = 0; i < participants.length; i++) {
            const pathX = config.padding + i * config.verticalSpacing;
            // 名前の位置付近（上部）をクリックしたかチェック
            if (Math.abs(x - pathX) < 40 && y < config.padding + 20) {
                tracePathWithAnimation(i, false);
                return;
            }
        }
    }
}

function tracePathWithAnimation(startIndex, showResult = false) {
    const path = tracePath(startIndex);
    let progress = 0;
    const totalSegments = path.length - 1;
    const stepsPerSegment = 20; // 各セグメントを20ステップで描画
    const totalSteps = totalSegments * stepsPerSegment;
    
    // animationSpeedに基づいてフレーム間隔を計算
    const frameInterval = 50 / config.animationSpeed;
    
    function animate() {
        if (progress <= totalSteps) {
            drawAmidakuji();
            
            ctx.strokeStyle = config.highlightColor;
            ctx.lineWidth = config.lineWidth + 2;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            // 現在のセグメントとセグメント内の進捗を計算
            const currentSegment = Math.floor(progress / stepsPerSegment);
            const segmentProgress = (progress % stepsPerSegment) / stepsPerSegment;
            
            ctx.beginPath();
            ctx.moveTo(path[0].x, path[0].y);
            
            // 完了したセグメントを描画
            for (let i = 0; i < currentSegment && i < totalSegments; i++) {
                ctx.lineTo(path[i + 1].x, path[i + 1].y);
            }
            
            // 現在のセグメントの途中まで描画
            if (currentSegment < totalSegments) {
                const point1 = path[currentSegment];
                const point2 = path[currentSegment + 1];
                const currentX = point1.x + (point2.x - point1.x) * segmentProgress;
                const currentY = point1.y + (point2.y - point1.y) * segmentProgress;
                ctx.lineTo(currentX, currentY);
            }
            
            ctx.stroke();
            
            progress++;
            setTimeout(animate, frameInterval);
        } else {
            // アニメーション終了後、結果を記録して囲みを追加
            const endIndex = path[path.length - 1].column;
            
            // 既に記録されていない場合のみ追加
            const alreadyRevealed = revealedPaths.some(
                r => r.participantIndex === startIndex && r.resultIndex === endIndex
            );
            if (!alreadyRevealed) {
                revealedPaths.push({
                    participantIndex: startIndex,
                    resultIndex: endIndex
                });
            }
            
            // 囲みを表示
            drawAmidakuji();
            
            // showResultがtrueの場合のみ結果テキストを表示
            if (showResult) {
                displayResult(startIndex, endIndex);
            }
        }
    }
    
    animate();
}

function tracePath(startColumn) {
    let currentColumn = startColumn;
    let currentY = config.padding;
    const path = [{ x: config.padding + currentColumn * config.verticalSpacing, y: currentY, column: currentColumn }];
    
    for (let line of horizontalLines) {
        // 現在の列から横線がある場合
        if (line.column === currentColumn) {
            // 横線の手前まで移動
            path.push({ 
                x: config.padding + currentColumn * config.verticalSpacing, 
                y: line.y,
                column: currentColumn
            });
            // 右に移動
            currentColumn++;
            path.push({ 
                x: config.padding + currentColumn * config.verticalSpacing, 
                y: line.y,
                column: currentColumn
            });
        } 
        // 左から来る横線がある場合
        else if (line.column === currentColumn - 1) {
            // 横線の手前まで移動
            path.push({ 
                x: config.padding + currentColumn * config.verticalSpacing, 
                y: line.y,
                column: currentColumn
            });
            // 左に移動
            currentColumn--;
            path.push({ 
                x: config.padding + currentColumn * config.verticalSpacing, 
                y: line.y,
                column: currentColumn
            });
        } else {
            // 横線がない場合は通過
            if (line.y > currentY) {
                currentY = line.y;
            }
        }
    }
    
    // 最後まで移動
    path.push({ 
        x: config.padding + currentColumn * config.verticalSpacing, 
        y: canvas.height - config.padding,
        column: currentColumn
    });
    
    return path;
}

// テキストを複数行に分割する関数（描画なし）
function calculateTextLines(text, maxWidth) {
    ctx.font = 'bold 16px sans-serif';
    
    // テキストの幅を測定
    const textWidth = ctx.measureText(text).width;
    
    // 最大幅以内なら1行で返す
    if (textWidth <= maxWidth) {
        return [text];
    }
    
    // 文字を1文字ずつ追加して、最大幅を超えたら改行
    const words = text.split('');
    let line = '';
    let lines = [];
    
    for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i];
        const testWidth = ctx.measureText(testLine).width;
        
        if (testWidth > maxWidth && line.length > 0) {
            lines.push(line);
            line = words[i];
        } else {
            line = testLine;
        }
    }
    lines.push(line);
    
    return lines;
}

// 長いテキストを複数行に分割して描画する関数
function drawMultiLineText(text, x, y, maxWidth, lineHeight) {
    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = config.resultColor;
    ctx.textAlign = 'center';
    
    const lines = calculateTextLines(text, maxWidth);
    
    // 複数行を描画（中央揃え）
    const startY = y - ((lines.length - 1) * lineHeight) / 2;
    for (let i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], x, startY + i * lineHeight);
    }
}

function displayResult(startIndex, endIndex) {
    // 結果をキャンバスに表示
    const x = config.padding + endIndex * config.verticalSpacing;
    const y = canvas.height - config.padding + 30;
    const maxWidth = config.verticalSpacing - 20; // 左右10pxのマージン
    drawMultiLineText(shuffledResults[endIndex], x, y, maxWidth, 20);
}

function showAllResults() {
    // キャンバスに結果を表示（左下の一覧は表示しない）
    const maxWidth = config.verticalSpacing - 20; // 左右10pxのマージン
    
    for (let i = 0; i < participants.length; i++) {
        const path = tracePath(i);
        const endIndex = path[path.length - 1].column;
        const x = config.padding + endIndex * config.verticalSpacing;
        const y = canvas.height - config.padding + 30;
        drawMultiLineText(shuffledResults[endIndex], x, y, maxWidth, 20);
    }
}

function toggleResultMode() {
    resultViewMode = !resultViewMode;
    const btn = document.getElementById('toggleResultMode');
    const info = document.getElementById('resultModeInfo');
    const createModeButtons = document.getElementById('createModeButtons');
    
    if (resultViewMode) {
        btn.textContent = '結果モード中...';
        btn.style.cssText = 'background: #27ae60 !important; color: white;';
        info.style.display = 'block';
        // ボタンを非表示にして結果表示モードに
        createModeButtons.style.display = 'none';
        // 他のモードを解除
        if (addLineMode) {
            toggleAddLineMode();
        }
        // 結果を表示（revealAllと同じ処理）
        showAllResults();
    } else {
        btn.textContent = '結果モード';
        btn.style.cssText = 'background: #667eea; color: white;';
        info.style.display = 'none';
        // ボタンを表示
        createModeButtons.style.display = 'flex';

        // キャンバスを再描画して結果をクリア
        drawAmidakuji();
    }
}

function toggleAddLineMode() {
    addLineMode = !addLineMode;
    const btn = document.getElementById('toggleAddMode');
    const info = document.getElementById('addModeInfo');
    
    if (addLineMode) {
        btn.textContent = '線を追加中...';
        btn.style.cssText = 'background: #ff6b6b !important; color: white;';
        info.style.display = 'block';
        canvas.style.cursor = 'pointer';
        // 結果モードを解除
        if (resultViewMode) {
            toggleResultMode();
        }
    } else {
        btn.textContent = '線を追加';
        btn.style.cssText = 'background: #6c757d; color: white;';
        info.style.display = 'none';
        canvas.style.cursor = 'pointer';
    }
    
    drawAmidakuji();
}

// モーダル管理
function openSettings() {
    document.getElementById('settingsModal').classList.add('active');
}

function closeSettings(event) {
    // 初回（あみだくじ未作成）の場合は閉じない
    if (results.length === 0) {
        return;
    }
    
    const modal = document.getElementById('settingsModal');
    // eventがundefinedの場合は閉じる、eventがあればモーダル外クリックのみ閉じる
    if (!event || event.target === modal) {
        modal.classList.remove('active');
    }
}

// リセット機能（線をクリアと同じ）
function resetAmidakuji() {
    horizontalLines = [];
    // 結果モードを解除
    if (resultViewMode) {
        toggleResultMode();
    }
    // 線追加モードを解除
    if (addLineMode) {
        toggleAddLineMode();
    }
    drawAmidakuji();
}
// 背景色をランダムに変更（前回と異なる色を選択）
function changeBackgroundColor() {
    let newColorPair;
    let availableColors = backgroundColors;
    
    // 前回の色がある場合、それを除外
    if (currentBackgroundColor) {
        availableColors = backgroundColors.filter(colorPair => 
            colorPair[0] !== currentBackgroundColor[0] || colorPair[1] !== currentBackgroundColor[1]
        );
    }
    
    // ランダムに色ペアを選択
    newColorPair = availableColors[Math.floor(Math.random() * availableColors.length)];
    
    // グラデーション背景を適用
    document.body.style.background = `linear-gradient(135deg, ${newColorPair[0]} 0%, ${newColorPair[1]} 100%)`;
    
    // 現在の色を記録
    currentBackgroundColor = newColorPair;
    
    console.log(`%c背景色変更: ${newColorPair[0]} → ${newColorPair[1]}`, `background: linear-gradient(90deg, ${newColorPair[0]}, ${newColorPair[1]}); padding: 5px; border-radius: 3px; color: white;`);
}