// Build info (auto-updated by GitHub Actions)
const BUILD_INFO = {
    version: '2025.12.12-0454',
    buildDate: '2025-12-12 13:53:56 +0900',
    commit: 'b4708ae'
};

let participants = [];
let results = [];
let horizontalLines = [];
let canvas, ctx;
let addLineMode = false;
let addablePositions = [];
let resultViewMode = false; // 結果モード：道順を見るモード
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
    animationSpeed: 5
};

// バージョン情報をコンソールに出力
console.log('%c🎯 あみだくじ', 'font-size: 20px; font-weight: bold; color: #667eea;');
console.log(`%cVersion: ${BUILD_INFO.version}`, 'color: #27ae60; font-weight: bold;');
console.log(`%cBuild Date: ${BUILD_INFO.buildDate}`, 'color: #27ae60;');
console.log(`%cCommit: ${BUILD_INFO.commit}`, 'color: #27ae60;');

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
        
        console.log('Canvas events initialized');
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
    const maxY = Math.max(
        config.horizontalSpacing * (horizontalLines.length + 2),
        400 // 最小の高さ
    );
    const canvasHeight = config.padding * 2 + maxY;
    
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

function handleCanvasClick(event) {
    const canvas = document.getElementById('amidakujiCanvas');
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;
    
    console.log('Click detected at:', x, y); // デバッグ用
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
    
    console.log('Touch detected at:', x, y); // デバッグ用
    
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
    let currentStep = 0;
    
    function animate() {
        if (currentStep < path.length - 1) {
            drawAmidakuji();
            
            ctx.strokeStyle = config.highlightColor;
            ctx.lineWidth = config.lineWidth + 2;
            
            for (let i = 0; i <= currentStep; i++) {
                const point1 = path[i];
                const point2 = path[i + 1];
                
                if (point2) {
                    ctx.beginPath();
                    ctx.moveTo(point1.x, point1.y);
                    ctx.lineTo(point2.x, point2.y);
                    ctx.stroke();
                }
            }
            
            currentStep++;
            setTimeout(animate, 50);
        } else {
            // アニメーション終了後、showResultがtrueの場合のみ結果を表示
            if (showResult) {
                const endIndex = path[path.length - 1].column;
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

function displayResult(startIndex, endIndex) {
    // 結果をキャンバスに表示
    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = config.resultColor;
    ctx.textAlign = 'center';
    const x = config.padding + endIndex * config.verticalSpacing;
    ctx.fillText(results[endIndex], x, canvas.height - config.padding + 30);
}

function showAllResults() {
    // キャンバスに結果を表示（左下の一覧は表示しない）
    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = config.resultColor;
    ctx.textAlign = 'center';
    
    for (let i = 0; i < participants.length; i++) {
        const path = tracePath(i);
        const endIndex = path[path.length - 1].column;
        const x = config.padding + endIndex * config.verticalSpacing;
        ctx.fillText(results[endIndex], x, canvas.height - config.padding + 30);
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
