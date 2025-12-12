// Build info (auto-updated by GitHub Actions)
const BUILD_INFO = {
    version: '__VERSION__',
    buildDate: '__BUILD_DATE__',
    commit: '__COMMIT_HASH__'
};

let participants = [];
let results = [];
let horizontalLines = [];
let canvas, ctx;
let addLineMode = false;
let addablePositions = [];
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
    const participantInput = document.getElementById('participants').value.trim();
    const resultInput = document.getElementById('results').value.trim();
    
    if (!participantInput || !resultInput) {
        alert('参加者と結果を入力してください。');
        return;
    }
    
    // 改行区切りをメインとし、1行のみの場合はスペース区切りも試す
    participants = participantInput.split('\n').map(p => p.trim()).filter(p => p);
    if (participants.length === 1 && participants[0].includes(' ')) {
        participants = participants[0].split(/\s+/).filter(p => p);
    }
    
    results = resultInput.split('\n').map(r => r.trim()).filter(r => r);
    if (results.length === 1 && results[0].includes(' ')) {
        results = results[0].split(/\s+/).filter(r => r);
    }
    
    if (participants.length !== results.length) {
        alert('参加者と結果の数を同じにしてください。');
        return;
    }
    
    if (participants.length < 2) {
        alert('参加者は2人以上必要です。');
        return;
    }
    
    // 横線をクリア（参加者数が変わった場合に備えて）
    horizontalLines = [];
    
    // 結果表示をクリア
    document.getElementById('resultsDisplay').innerHTML = '';
    document.getElementById('resultsDisplay').style.display = 'none';
    
    drawAmidakuji();
}

function clearLines() {
    horizontalLines = [];
    document.getElementById('resultsDisplay').innerHTML = '';
    document.getElementById('resultsDisplay').style.display = 'none';
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
    
    // 列ごとに等間隔で追加可能位置を計算（奇数列と偶数列でずらす）
    for (let col = 0; col < numPaths - 1; col++) {
        const startY = config.padding + spacing + (col % 2 === 0 ? 0 : offset);
        for (let y = startY; y < canvas.height - config.padding; y += spacing) {
            addablePositions.push({ y, column: col, id: addablePositions.length });
        }
    }
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
    
    // 参加者名を描画
    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = config.participantColor;
    ctx.textAlign = 'center';
    
    for (let i = 0; i < participants.length; i++) {
        const x = config.padding + i * config.verticalSpacing;
        ctx.fillText(participants[i], x, config.padding - 20);
    }
    
    // 結果を描画（最初は隠す）
    ctx.fillStyle = config.resultColor;
    for (let i = 0; i < results.length; i++) {
        const x = config.padding + i * config.verticalSpacing;
        // 結果は最初は表示しない
    }
    
    // キャンバスのサイズが確定した後に追加可能位置を計算
    calculateAddablePositions();
    
    // 追加モードの場合、追加可能な位置に数字を表示
    if (addLineMode) {
        drawAddablePositions();
    }
    
    // クリックイベントを追加
    canvas.onclick = handleCanvasClick;
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
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    if (addLineMode) {
        // 追加可能な位置がクリックされたかチェック
        for (let pos of addablePositions) {
            const posX = config.padding + pos.column * config.verticalSpacing + config.verticalSpacing / 2;
            const distance = Math.sqrt(Math.pow(x - posX, 2) + Math.pow(y - pos.y, 2));
            
            if (distance < 20) {
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
    } else {
        // 参加者名がクリックされたかチェック
        for (let i = 0; i < participants.length; i++) {
            const participantX = config.padding + i * config.verticalSpacing;
            if (Math.abs(x - participantX) < 30 && y < config.padding) {
                tracePathWithAnimation(i);
                break;
            }
        }
    }
}

function tracePathWithAnimation(startIndex) {
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
            // アニメーション終了後、結果を表示
            const endIndex = path[path.length - 1].column;
            showResult(startIndex, endIndex);
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

function showResult(startIndex, endIndex) {
    const resultsDisplay = document.getElementById('resultsDisplay');
    resultsDisplay.style.display = 'block';
    
    const resultItem = document.createElement('div');
    resultItem.className = 'result-item';
    resultItem.innerHTML = `<strong>${participants[startIndex]}</strong> → ${results[endIndex]}`;
    
    resultsDisplay.appendChild(resultItem);
    
    // 結果をキャンバスにも表示
    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = config.resultColor;
    ctx.textAlign = 'center';
    const x = config.padding + endIndex * config.verticalSpacing;
    ctx.fillText(results[endIndex], x, canvas.height - config.padding + 30);
}

function revealAll() {
    const resultsDisplay = document.getElementById('resultsDisplay');
    resultsDisplay.innerHTML = '';
    resultsDisplay.style.display = 'block';
    
    for (let i = 0; i < participants.length; i++) {
        const path = tracePath(i);
        const endIndex = path[path.length - 1].column;
        
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';
        resultItem.innerHTML = `<strong>${participants[i]}</strong> → ${results[endIndex]}`;
        resultItem.style.animationDelay = `${i * 0.1}s`;
        
        resultsDisplay.appendChild(resultItem);
    }
    
    // すべての結果をキャンバスに表示
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

function toggleAddLineMode() {
    addLineMode = !addLineMode;
    const btn = document.getElementById('toggleAddMode');
    const info = document.getElementById('addModeInfo');
    
    if (addLineMode) {
        btn.textContent = '線を追加中...';
        btn.style.cssText = 'background: #ff6b6b !important; color: white;';
        info.style.display = 'block';
        canvas.style.cursor = 'pointer';
    } else {
        btn.textContent = '線を追加';
        btn.style.cssText = 'background: #6c757d; color: white;';
        info.style.display = 'none';
        canvas.style.cursor = 'pointer';
    }
    
    drawAmidakuji();
}
